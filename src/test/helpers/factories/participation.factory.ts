import type {
  GetEventAttendeesResponse,
  SetEventAttendanceCommand,
  SetEventAttendanceResponse,
} from '@volontariapp/contracts-nest';

export const PARTICIPATION_EVENT_ID = '123e4567-e89b-12d3-a456-426614174000';

export const createSetEventAttendanceCommandFactory = (
  overrides: Partial<SetEventAttendanceCommand> = {},
): SetEventAttendanceCommand => ({
  eventId: PARTICIPATION_EVENT_ID,
  checkedUserIds: ['user-1', 'user-2'],
  uncheckedUserIds: ['user-3'],
  ...overrides,
});

export const createGetEventAttendeesResponseFactory = (
  overrides: Partial<GetEventAttendeesResponse> = {},
): GetEventAttendeesResponse => ({
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
  pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
  ...overrides,
});

export const createSetEventAttendanceResponseFactory = (): SetEventAttendanceResponse => ({});
