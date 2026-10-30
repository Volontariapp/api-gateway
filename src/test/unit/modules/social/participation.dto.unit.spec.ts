import 'reflect-metadata';
import { validate } from 'class-validator';
import { SetEventAttendanceRequestDTO } from '../../../../modules/social/dto/request/set-event-attendance.request.dto.js';
import { GetEventAttendeesResponseDTO } from '../../../../modules/social/dto/response/get-event-attendees.response.dto.js';
import { ParticipationCommandController } from '../../../../modules/social/controllers/commands/participation/participation.command-controller.js';
import { createGetEventAttendeesResponseFactory } from '../../../helpers/factories/participation.factory.js';

const uuid = (n: number): string => `123e4567-e89b-42d3-a456-${String(n).padStart(12, '0')}`;
const uuids = (count: number): string[] => Array.from({ length: count }, (_, i) => uuid(i));

const buildDto = (checked: string[], unchecked: string[] = []): SetEventAttendanceRequestDTO => {
  const dto = new SetEventAttendanceRequestDTO();
  dto.checkedUserIds = checked;
  dto.uncheckedUserIds = unchecked;
  return dto;
};

describe('Participation DTOs (Unit)', () => {
  describe('SetEventAttendanceRequestDTO', () => {
    it('should accept batches up to 500 ids', async () => {
      expect(await validate(buildDto(uuids(500), uuids(500)))).toHaveLength(0);
    });

    it('should reject more than 500 checked ids', async () => {
      const errors = await validate(buildDto(uuids(501)));
      expect(errors.map((e) => e.property)).toEqual(['checkedUserIds']);
    });

    it('should reject more than 500 unchecked ids', async () => {
      const errors = await validate(buildDto(uuids(1), uuids(501)));
      expect(errors.map((e) => e.property)).toEqual(['uncheckedUserIds']);
    });
  });

  describe('GetEventAttendeesResponseDTO.from', () => {
    it('should convert timestamps to Dates and keep pagination', () => {
      const res = createGetEventAttendeesResponseFactory();
      const dto = GetEventAttendeesResponseDTO.from(res);

      expect(dto.attendees[0].registeredAt).toEqual(new Date(1717200000 * 1000));
      expect(dto.attendees[0].checkedInAt).toEqual(new Date(1717203600 * 1000));
      expect(dto.attendees[1].checkedInAt).toBeUndefined();
      expect(dto.pagination).toEqual(res.pagination);
    });
  });

  describe('ParticipationCommandController.setEventAttendance', () => {
    it('should document the default POST status 201', () => {
      const handler: unknown = Reflect.getOwnPropertyDescriptor(
        ParticipationCommandController.prototype,
        'setEventAttendance',
      )?.value;
      if (typeof handler !== 'function') {
        throw new Error('setEventAttendance handler not found');
      }
      const responses = Reflect.getMetadata('swagger/apiResponse', handler) as Record<
        string,
        unknown
      >;
      expect(Object.keys(responses)).toContain('201');
      expect(Reflect.getMetadata('__httpCode__', handler)).toBeUndefined();
    });
  });
});
