import type { jest } from '@jest/globals';
import { createMock } from '@volontariapp/testing';
import type { LiveWsClient } from '../../../modules/live/services/live-ws.client.js';

/** LiveWsClient whose calls to ws-service succeed without leaving the process. */
export function createLiveWsClientMock(): jest.Mocked<LiveWsClient> {
  const client = createMock<LiveWsClient>();
  client.grant.mockResolvedValue(undefined);
  client.revoke.mockResolvedValue(undefined);
  return client;
}
