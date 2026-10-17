import { validate } from 'class-validator';
import { CreateEventRequestDTO } from '../../../../modules/event/dto/request/create-event.request.dto.js';
import { EVENT_COVER_FILE_ID } from '../../../helpers/factories/event.factory.js';

const IDEMPOTENCY_KEY = '5d0e4a3c-7f0b-4b76-9a52-0d1f4f3b9e11';

const buildDto = (overrides: Partial<CreateEventRequestDTO> = {}): CreateEventRequestDTO =>
  Object.assign(new CreateEventRequestDTO(), {
    title: 'Maraude du samedi',
    description: 'Distribution de repas',
    startAt: new Date('2026-10-15T10:00:00Z'),
    endAt: new Date('2026-10-15T12:00:00Z'),
    localisationName: 'Paris',
    awardedImpactScore: 10,
    maxParticipants: 50,
    tagIds: [],
    idempotencyKey: IDEMPOTENCY_KEY,
    ...overrides,
  });

describe('CreateEventRequestDTO (Unit)', () => {
  it('should accept an event without a cover', async () => {
    expect(await validate(buildDto())).toHaveLength(0);
  });

  it('should accept a cover file id', async () => {
    expect(await validate(buildDto({ coverFileId: EVENT_COVER_FILE_ID }))).toHaveLength(0);
  });

  it('should reject a cover that is not a UUID', async () => {
    const errors = await validate(buildDto({ coverFileId: 'https://cdn.test/a.webp' }));

    expect(errors.some((e) => e.property === 'coverFileId')).toBe(true);
  });

  it('should reject an empty idempotency key', async () => {
    const errors = await validate(buildDto({ idempotencyKey: '' }));

    expect(errors.some((e) => e.property === 'idempotencyKey')).toBe(true);
  });

  it('should reject a missing idempotency key', async () => {
    const dto = buildDto();
    Reflect.deleteProperty(dto, 'idempotencyKey');

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'idempotencyKey')).toBe(true);
  });

  it('should relay coverFileId and idempotencyKey in the command', () => {
    const command = buildDto({ coverFileId: EVENT_COVER_FILE_ID }).toCommand();

    expect(command.coverFileId).toBe(EVENT_COVER_FILE_ID);
    expect(command.idempotencyKey).toBe(IDEMPOTENCY_KEY);
  });
});
