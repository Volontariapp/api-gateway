import { validate } from 'class-validator';
import { CreatePostRequestDTO } from '../../../../modules/post/dto/request/create-post.request.dto.js';
import { POST_FILE_ID_1 } from '../../../helpers/factories/post.factory.js';

const IDEMPOTENCY_KEY = '5d0e4a3c-7f0b-4b76-9a52-0d1f4f3b9e11';

const buildDto = (overrides: Partial<CreatePostRequestDTO> = {}): CreatePostRequestDTO =>
  Object.assign(new CreatePostRequestDTO(), {
    title: 'Mission Maraude Paris',
    content: 'Besoin de 5 benevoles ce samedi',
    idempotencyKey: IDEMPOTENCY_KEY,
    ...overrides,
  });

const uuids = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);

describe('CreatePostRequestDTO (Unit)', () => {
  it('should accept a post without files', async () => {
    expect(await validate(buildDto())).toHaveLength(0);
  });

  it('should accept up to 10 file ids', async () => {
    expect(await validate(buildDto({ fileIds: uuids(10) }))).toHaveLength(0);
  });

  it('should reject more than 10 file ids', async () => {
    const errors = await validate(buildDto({ fileIds: uuids(11) }));

    expect(errors.some((e) => e.property === 'fileIds')).toBe(true);
  });

  it('should reject a file id that is not a UUID', async () => {
    const errors = await validate(buildDto({ fileIds: ['https://cdn.test/a.webp'] }));

    expect(errors.some((e) => e.property === 'fileIds')).toBe(true);
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

  it('should relay fileIds and idempotencyKey in the command', () => {
    const command = buildDto({ fileIds: [POST_FILE_ID_1] }).toCommand();

    expect(command.fileIds).toEqual([POST_FILE_ID_1]);
    expect(command.idempotencyKey).toBe(IDEMPOTENCY_KEY);
  });
});
