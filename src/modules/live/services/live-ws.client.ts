import { Injectable } from '@nestjs/common';
import axios, { type Method } from 'axios';
import { JwtService, type AuthUser } from '@volontariapp/auth';
import { BRIDGE_CONNECTION_FAILED } from '@volontariapp/errors-nest';
import { Logger } from '@volontariapp/logger';
import type { ILiveGrantRequest, ILiveRevokeRequest } from '@volontariapp/messaging';
import { AppConfigService } from '../../../config/app-config.service.js';
import { LIVE_WS_TIMEOUT_MS, type LiveRevokeReason } from '../constants/live.constants.js';

const GRANTS_PATH = '/internal/live/grants';
const INTERNAL_TOKEN_HEADER = 'x-internal-token';

/** What the gateway decides about a grant. `userId` is never an input: it is the caller. */
export type LiveGrantDetails = Omit<ILiveGrantRequest, 'userId'>;

interface WsServiceCall {
  operation: 'grant' | 'revoke';
  method: Method;
  path: string;
  data: ILiveGrantRequest | ILiveRevokeRequest;
  eventId: string;
}

/**
 * HTTP client of the internal live endpoints of ws-service (D13, D18).
 *
 * Every call carries an internal token signed for the caller. ws-service requires
 * `token.id === userId`, so the body and the path always use the id of the caller: the API takes the
 * caller, never a user id of its own, which makes a mismatch impossible to express.
 *
 * Nothing is logged but identifiers and a status: an axios error holds the request body, which
 * carries the coordinates of the event, so the error object itself is never logged.
 */
@Injectable()
export class LiveWsClient {
  private readonly logger = new Logger({ context: LiveWsClient.name });

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async grant(caller: AuthUser, details: LiveGrantDetails): Promise<void> {
    const data: ILiveGrantRequest = { ...details, userId: caller.id };
    await this.call(caller, {
      operation: 'grant',
      method: 'PUT',
      path: GRANTS_PATH,
      data,
      eventId: details.eventId,
    });
  }

  async revoke(caller: AuthUser, eventId: string, reason: LiveRevokeReason): Promise<void> {
    const data: ILiveRevokeRequest = { eventId, userId: caller.id, reason };
    await this.call(caller, {
      operation: 'revoke',
      method: 'DELETE',
      path: `${GRANTS_PATH}/${encodeURIComponent(eventId)}/${encodeURIComponent(caller.id)}`,
      data,
      eventId,
    });
  }

  private async call(caller: AuthUser, request: WsServiceCall): Promise<void> {
    const token = await this.jwtService.signInternal({ id: caller.id, role: caller.role });
    try {
      await axios.request({
        method: request.method,
        url: `${this.baseUrl()}${request.path}`,
        data: request.data,
        headers: { [INTERNAL_TOKEN_HEADER]: token },
        timeout: LIVE_WS_TIMEOUT_MS,
        // The token must never follow a redirect to another host.
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 300,
      });
    } catch (error: unknown) {
      const outcome = axios.isAxiosError(error)
        ? `status ${String(error.response?.status ?? error.code ?? 'unknown')}`
        : 'unexpected error';
      this.logger.error(
        `ws-service ${request.operation} failed for event ${request.eventId} and user ${caller.id}: ${outcome}`,
      );
      throw BRIDGE_CONNECTION_FAILED('live sharing', 'service unavailable');
    }
  }

  private baseUrl(): string {
    const rawUrl = this.configService.msWsUrl;
    const url = rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`;
    return url.replace(/\/+$/, '');
  }
}
