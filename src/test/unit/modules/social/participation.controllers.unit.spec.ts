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

describe('Participation Controllers (Unit)', () => {
  const eventId = '123e4567-e89b-12d3-a456-426614174000';
  const metadata = new Metadata();
  const mockReq = { internalMetadata: metadata };

  describe('ParticipationCommandController', () => {
    let controller: ParticipationCommandController;
    let mockCommandService: jest.Mocked<ParticipationCommandServiceClient>;
    let setAttendanceMock: ReturnType<typeof jest.fn>;

    beforeEach(() => {
      setAttendanceMock = jest.fn().mockReturnValue(of({}));
      mockCommandService = createMock<ParticipationCommandServiceClient>();
      mockCommandService.setEventAttendance = setAttendanceMock as never;

      const mockClient = new MockServicesClientGrpc({
        [PARTICIPATION_COMMAND_SERVICE_NAME]: mockCommandService,
        [PARTICIPATION_QUERY_SERVICE_NAME]: createMock<ParticipationQueryServiceClient>(),
      });

      controller = new ParticipationCommandController(mockClient);
      controller.onModuleInit();
    });

    it('should call setEventAttendance with command payload and return success response', async () => {
      const dto = new SetEventAttendanceRequestDTO();
      dto.checkedUserIds = ['user-1', 'user-2'];
      dto.uncheckedUserIds = ['user-3'];

      const response$ = controller.setEventAttendance(eventId, dto, mockReq);
      const response = await firstValueFrom(response$);

      expect(setAttendanceMock).toHaveBeenCalledWith(
        {
          eventId,
          checkedUserIds: ['user-1', 'user-2'],
          uncheckedUserIds: ['user-3'],
        },
        metadata,
      );
      expect(response).toEqual({
        success: true,
        message: 'Attendance updated',
      });
    });
  });

  describe('ParticipationQueryController', () => {
    let controller: ParticipationQueryController;
    let mockQueryService: jest.Mocked<ParticipationQueryServiceClient>;
    let getAttendeesMock: ReturnType<typeof jest.fn>;

    beforeEach(() => {
      getAttendeesMock = jest.fn().mockReturnValue(
        of({
          attendees: [
            {
              userId: 'user-1',
              registeredAt: { seconds: 1717200000, nanos: 0 },
              checkedInAt: { seconds: 1717203600, nanos: 0 },
            },
            {
              userId: 'user-2',
              registeredAt: { seconds: 1717200100, nanos: 0 },
              checkedInAt: undefined,
            },
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        }),
      );
      mockQueryService = createMock<ParticipationQueryServiceClient>();
      mockQueryService.getEventAttendees = getAttendeesMock as never;

      const mockClient = new MockServicesClientGrpc({
        [PARTICIPATION_COMMAND_SERVICE_NAME]: createMock<ParticipationCommandServiceClient>(),
        [PARTICIPATION_QUERY_SERVICE_NAME]: mockQueryService,
      });

      controller = new ParticipationQueryController(mockClient);
      controller.onModuleInit();
    });

    it('should map attendees gRPC timestamps to Dates and return paginated list', async () => {
      const dto = new GetEventAttendeesRequestDTO();
      dto.pagination = { page: 1, limit: 10 };

      const response$ = controller.getEventAttendees(eventId, dto, mockReq);
      const response = await firstValueFrom(response$);

      expect(getAttendeesMock).toHaveBeenCalledWith(
        {
          eventId,
          pagination: { page: 1, limit: 10 },
        },
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
