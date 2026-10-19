import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { firstValueFrom, of } from 'rxjs';
import {
  FeedbackAction,
  RANKING_COMMAND_SERVICE_NAME,
  RankingListKind,
  type RankingCommandServiceClient,
} from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import { RankingCommandController } from '../../../../modules/ranking/controllers/commands/ranking.command-controller.js';
import {
  EventFeedbackItemRequestDTO,
  RecordEventFeedbackRequestDTO,
  RequestRankingRefreshRequestDTO,
  UpdateUserLocationRequestDTO,
} from '../../../../modules/ranking/dto/request/index.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { createAuthUserMock } from '../../../helpers/factories/auth-user.factory.js';
import { RANKED_EVENT_ID_1 } from '../../../helpers/constants/ranking-test.constants.js';

describe('RankingCommandController (Unit)', () => {
  let commandService: jest.Mocked<WithMetadata<RankingCommandServiceClient>>;
  let controller: RankingCommandController;
  const user = createAuthUserMock();
  const metadata = new Metadata();
  const req = { internalMetadata: metadata };

  beforeEach(() => {
    commandService = createMock<WithMetadata<RankingCommandServiceClient>>();
    controller = new RankingCommandController(
      new MockServicesClientGrpc({ [RANKING_COMMAND_SERVICE_NAME]: commandService }),
    );
    controller.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should send the list kind as the gRPC enum and return refreshThrottled as is', async () => {
    const spy = jest
      .spyOn(commandService, 'requestRankingRefresh')
      .mockReturnValue(of({ accepted: false, refreshThrottled: true }));
    const request = Object.assign(new RequestRankingRefreshRequestDTO(), { listKind: 'POST' });

    const response = await firstValueFrom(controller.requestRefresh(request, user, req));

    expect(spy).toHaveBeenCalledWith(
      { listKind: RankingListKind.RANKING_LIST_KIND_POST },
      metadata,
    );
    expect(response).toEqual({ accepted: false, refreshThrottled: true });
  });

  it('should forward the position with the internal metadata', async () => {
    const spy = jest
      .spyOn(commandService, 'updateUserLocation')
      .mockReturnValue(of({ accepted: true }));
    const request = Object.assign(new UpdateUserLocationRequestDTO(), { lat: 48.85, lng: 2.35 });

    const response = await firstValueFrom(controller.updateLocation(request, user, req));

    expect(spy).toHaveBeenCalledWith({ lat: 48.85, lng: 2.35 }, metadata);
    expect(response.accepted).toBe(true);
  });

  it('should send each PASS as the gRPC feedback action', async () => {
    const spy = jest
      .spyOn(commandService, 'recordEventFeedback')
      .mockReturnValue(of({ recorded: 1 }));
    const item = Object.assign(new EventFeedbackItemRequestDTO(), {
      eventId: RANKED_EVENT_ID_1,
      action: 'PASS',
    });
    const request = Object.assign(new RecordEventFeedbackRequestDTO(), { items: [item] });

    const response = await firstValueFrom(controller.recordEventFeedback(request, user, req));

    expect(spy).toHaveBeenCalledWith(
      { items: [{ eventId: RANKED_EVENT_ID_1, action: FeedbackAction.FEEDBACK_ACTION_PASS }] },
      metadata,
    );
    expect(response.recorded).toBe(1);
  });
});
