import { describe, expect, it } from '@jest/globals';
import { GrpcStatus, NotFoundError, InternalServerError } from '@volontariapp/errors';
import { isGrpcNotFound } from '../../../../modules/live/helpers/grpc-not-found.helper.js';
import {
  computeGrantExpiry,
  isInsideSharingWindow,
} from '../../../../modules/live/helpers/live-sharing-window.helper.js';
import { LIVE_NOW, LiveSharingFactory } from '../../../helpers/factories/live-sharing.factory.js';

describe('Live sharing helpers (Unit)', () => {
  describe('isGrpcNotFound', () => {
    it('should recognize a decoded 404 business error', () => {
      expect(isGrpcNotFound(new NotFoundError('gone'))).toBe(true);
      expect(isGrpcNotFound(new InternalServerError('boom'))).toBe(false);
    });

    it('should recognize the gRPC status NOT_FOUND', () => {
      expect(isGrpcNotFound({ code: GrpcStatus.NOT_FOUND, details: 'x' })).toBe(true);
      expect(isGrpcNotFound({ code: GrpcStatus.UNAVAILABLE, details: 'x' })).toBe(false);
    });

    it('should recognize the JSON error body of ms-* in the details', () => {
      const details = `{"statusCode":404,"code":"NOT_FOUND","message":"gone"}`;
      expect(isGrpcNotFound({ details })).toBe(true);
      expect(isGrpcNotFound({ details: '{"statusCode":500}' })).toBe(false);
      expect(isGrpcNotFound({ details: '{not json}' })).toBe(false);
    });

    it('should not take anything else for a not found', () => {
      expect(isGrpcNotFound(undefined)).toBe(false);
      expect(isGrpcNotFound('404')).toBe(false);
      expect(isGrpcNotFound(new Error('plain'))).toBe(false);
    });
  });

  describe('window', () => {
    const startAt = LiveSharingFactory.at(60);
    const endAt = LiveSharingFactory.at(120);

    it('should open 30 minutes before the start and close at the end, both included', () => {
      expect(isInsideSharingWindow(startAt, endAt, LiveSharingFactory.at(29))).toBe(false);
      expect(isInsideSharingWindow(startAt, endAt, LiveSharingFactory.at(30))).toBe(true);
      expect(isInsideSharingWindow(startAt, endAt, LiveSharingFactory.at(120))).toBe(true);
      expect(isInsideSharingWindow(startAt, endAt, LiveSharingFactory.at(121))).toBe(false);
    });

    it('should end the authorization 15 minutes after the event, within 8 hours', () => {
      expect(computeGrantExpiry(LiveSharingFactory.at(90), LIVE_NOW)).toEqual(
        LiveSharingFactory.at(105),
      );
      expect(computeGrantExpiry(LiveSharingFactory.at(8 * 60 - 15), LIVE_NOW)).toEqual(
        LiveSharingFactory.at(8 * 60),
      );
      expect(computeGrantExpiry(LiveSharingFactory.at(8 * 60), LIVE_NOW)).toEqual(
        LiveSharingFactory.at(8 * 60),
      );
    });
  });
});
