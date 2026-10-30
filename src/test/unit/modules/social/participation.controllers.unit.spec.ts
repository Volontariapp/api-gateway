import { jest } from '@jest/globals';
import { of, firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import {
  PARTICIPATION_COMMAND_SERVICE_NAME,
  PARTICIPATION_QUERY_SERVICE_NAME,
  type ParticipationCommandServiceClient,
  type ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import { ParticipationCommandController } from '../../../../modules/social/controllers/commands/participation/participation.command-controller.js';
import { ParticipationQueryController } from '../../../../modules/social/controllers/queries/participation/participation.query-controller.js';
import { SetEventAttendanceRequestDTO } from '../../../../modules/social/dto/request/set-event-attendance.request.dto.js';
import { GetEventAttendeesRequestDTO } from '../../../../modules/social/dto/request/get-event-attendees.request.dto.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import {
  PARTICIPATION_EVENT_ID as eventId,
  createGetEventAttendeesResponseFactory,
  createSetEventAttendanceCommandFactory,
  createSetEventAttendanceResponseFactory,
} from '../../../helpers/factories/participation.factory.js';

describe('Participation Controllers (Unit)', () => {
  const metadata = new Metadata();
  const mockReq = { internalMetadata: metadata };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ParticipationCommandController', () => {
    let controller: ParticipationCommandController;
    let mockCommandService: jest.Mocked<ParticipationCommandServiceClient>;

    beforeEach(() => {
      mockCommandService = createMock<ParticipationCommandServiceClient>();

      const mockClient = new MockServicesClientGrpc({
        [PARTICIPATION_COMMAND_SERVICE_NAME]: mockCommandService,
        [PARTICIPATION_QUERY_SERVICE_NAME]: createMock<ParticipationQueryServiceClient>(),
      });

      controller = new ParticipationCommandController(mockClient);
      controller.onModuleInit();
    });

    it('should call setEventAttendance with command payload and return success response', async () => {
      const setAttendanceSpy = jest
        .spyOn(mockCommandService, 'setEventAttendance')
        .mockReturnValue(of(createSetEventAttendanceResponseFactory()));
      const command = createSetEventAttendanceCommandFactory();
      const dto = new SetEventAttendanceRequestDTO();
      dto.checkedUserIds = command.checkedUserIds;
      dto.uncheckedUserIds = command.uncheckedUserIds;

      const response = await firstValueFrom(controller.setEventAttendance(eventId, dto, mockReq));

      expect(setAttendanceSpy).toHaveBeenCalledWith(command, metadata);
      expect(response).toEqual({
        success: true,
        message: 'Attendance updated',
      });
    });
  });

  describe('ParticipationQueryController', () => {
    let controller: ParticipationQueryController;
    let mockQueryService: jest.Mocked<ParticipationQueryServiceClient>;

    beforeEach(() => {
      mockQueryService = createMock<ParticipationQueryServiceClient>();

      const mockClient = new MockServicesClientGrpc({
        [PARTICIPATION_COMMAND_SERVICE_NAME]: createMock<ParticipationCommandServiceClient>(),
        [PARTICIPATION_QUERY_SERVICE_NAME]: mockQueryService,
      });

      controller = new ParticipationQueryController(mockClient);
      controller.onModuleInit();
    });

    it('should map attendees gRPC timestamps to Dates and return paginated list', async () => {
      const getAttendeesSpy = jest
        .spyOn(mockQueryService, 'getEventAttendees')
        .mockReturnValue(of(createGetEventAttendeesResponseFactory()));
      const dto = new GetEventAttendeesRequestDTO();
      dto.pagination = { page: 1, limit: 10 };

      const response = await firstValueFrom(controller.getEventAttendees(eventId, dto, mockReq));

      expect(getAttendeesSpy).toHaveBeenCalledWith(
        { eventId, pagination: { page: 1, limit: 10 } },
        metadata,
      );
      expect(response.attendees).toHaveLength(2);
      expect(response.attendees[0].userId).toBe('user-1');
      expect(response.attendees[0].registeredAt).toEqual(new Date(1717200000 * 1000));
      expect(response.attendees[0].checkedInAt).toEqual(new Date(1717203600 * 1000));
      expect(response.attendees[1].checkedInAt).toBeUndefined();
    });
  });
});
