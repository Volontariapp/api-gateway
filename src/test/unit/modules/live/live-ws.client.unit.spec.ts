import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { JwtService } from '@volontariapp/auth';
import { BRIDGE_CONNECTION_FAILED } from '@volontariapp/errors-nest';
import { Logger } from '@volontariapp/logger';
import type { ILiveGrantRequest, ILiveRevokeRequest } from '@volontariapp/messaging';
import { LiveWsClient } from '../../../../modules/live/services/live-ws.client.js';
import { setupVolontariappLoggerMock } from '../../../helpers/mocks/volontariapp-logger.mock.js';
import {
  createJwtServiceMock,
  SIGNED_INTERNAL_TOKEN,
} from '../../../helpers/mocks/jwt-service.mock.js';
import { createAuthUserMock } from '../../../helpers/factories/auth-user.factory.js';
import {
  LIVE_CALLER_ID,
  LIVE_EVENT_ID,
  LIVE_EVENT_LATITUDE,
  LIVE_EVENT_LONGITUDE,
  LIVE_ORGANIZER_ID,
  LIVE_WS_URL,
  LiveSharingFactory,
} from '../../../helpers/factories/live-sharing.factory.js';

describe('LiveWsClient (Unit)', () => {
  let jwtService: jest.Mocked<JwtService>;
  let signSpy: jest.SpiedFunction<JwtService['signInternal']>;
  let requestSpy: jest.SpiedFunction<typeof axios.request>;
  const caller = createAuthUserMock({ id: LIVE_CALLER_ID, role: 'USER' });
  const grantDetails = {
    eventId: LIVE_EVENT_ID,
    organizerId: LIVE_ORGANIZER_ID,
    eventLatitude: LIVE_EVENT_LATITUDE,
    eventLongitude: LIVE_EVENT_LONGITUDE,
    expiresAt: '2026-11-07T13:45:00.000Z',
  };

  const createClient = (msWsUrl?: string) =>
    new LiveWsClient(jwtService, LiveSharingFactory.createConfigService(msWsUrl));
  const sentConfig = (): AxiosRequestConfig => {
    const call = requestSpy.mock.calls.at(0);
    if (call === undefined) {
      throw new Error('ws-service was not called');
    }
    return call[0];
  };

  beforeEach(() => {
    setupVolontariappLoggerMock();
    jwtService = createJwtServiceMock();
    signSpy = jest.spyOn(jwtService, 'signInternal');
    requestSpy = jest.spyOn(axios, 'request').mockResolvedValue({ status: 204 });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('grant', () => {
    it('should PUT the grant, with the caller as userId, to the internal endpoint', async () => {
      await createClient().grant(caller, grantDetails);

      const expectedBody: ILiveGrantRequest = { ...grantDetails, userId: LIVE_CALLER_ID };
      expect(sentConfig()).toMatchObject({
        method: 'PUT',
        url: `http://${LIVE_WS_URL}/internal/live/grants`,
        data: expectedBody,
      });
    });

    it('should sign the internal token for the caller, with the id and the role only', async () => {
      const admin = createAuthUserMock({ id: LIVE_CALLER_ID, role: 'ADMIN', email: 'a@b.fr' });

      await createClient().grant(admin, grantDetails);

      expect(signSpy).toHaveBeenCalledWith({ id: LIVE_CALLER_ID, role: 'ADMIN' });
      expect(sentConfig().headers).toEqual({ 'x-internal-token': SIGNED_INTERNAL_TOKEN });
    });

    it('should not follow a redirect and should not wait forever', async () => {
      await createClient().grant(caller, grantDetails);

      expect(sentConfig().maxRedirects).toBe(0);
      expect(sentConfig().timeout).toBe(5000);
    });

    it('should accept a URL that already has a scheme or a trailing slash', async () => {
      await createClient('https://ws.internal/').grant(caller, grantDetails);

      expect(sentConfig().url).toBe('https://ws.internal/internal/live/grants');
    });
  });

  describe('revoke', () => {
    it('should DELETE the grant of the caller with the reason and the same bound token', async () => {
      await createClient().revoke(caller, LIVE_EVENT_ID, 'ARRIVED');

      const expectedBody: ILiveRevokeRequest = {
        eventId: LIVE_EVENT_ID,
        userId: LIVE_CALLER_ID,
        reason: 'ARRIVED',
      };
      expect(sentConfig()).toMatchObject({
        method: 'DELETE',
        url: `http://${LIVE_WS_URL}/internal/live/grants/${LIVE_EVENT_ID}/${LIVE_CALLER_ID}`,
        data: expectedBody,
      });
      expect(signSpy).toHaveBeenCalledWith({ id: LIVE_CALLER_ID, role: 'USER' });
      expect(sentConfig().headers).toEqual({ 'x-internal-token': SIGNED_INTERNAL_TOKEN });
    });
  });

  describe('failures of ws-service', () => {
    it('should log identifiers and a status only, never the request that holds coordinates', async () => {
      const logged: string[] = [];
      jest.spyOn(Logger.prototype, 'error').mockImplementation((...args: unknown[]) => {
        logged.push(args.map((arg) => JSON.stringify(arg)).join(' '));
      });
      const config: InternalAxiosRequestConfig = {
        data: JSON.stringify(grantDetails),
        headers: new AxiosHeaders(),
      };
      requestSpy.mockRejectedValue(
        new AxiosError(
          'Request failed with status code 403',
          'ERR_BAD_REQUEST',
          config,
          undefined,
          {
            status: 403,
            statusText: 'Forbidden',
            data: {},
            headers: {},
            config,
          },
        ),
      );

      await expect(createClient().grant(caller, grantDetails)).rejects.toEqual(
        BRIDGE_CONNECTION_FAILED('live sharing', 'service unavailable'),
      );

      const output = logged.join('\n');
      expect(output).toContain(LIVE_EVENT_ID);
      expect(output).toContain(LIVE_CALLER_ID);
      expect(output).toContain('403');
      expect(output).not.toContain(String(LIVE_EVENT_LATITUDE));
      expect(output).not.toContain(SIGNED_INTERNAL_TOKEN);
    });

    it('should answer the same error when ws-service is unreachable, on grant and on revoke', async () => {
      requestSpy.mockRejectedValue(new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED'));
      const failure = BRIDGE_CONNECTION_FAILED('live sharing', 'service unavailable');

      await expect(createClient().grant(caller, grantDetails)).rejects.toEqual(failure);
      await expect(createClient().revoke(caller, LIVE_EVENT_ID, 'STOPPED')).rejects.toEqual(
        failure,
      );
    });
  });
});
