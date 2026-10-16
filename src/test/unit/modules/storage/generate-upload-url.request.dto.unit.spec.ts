import { validate } from 'class-validator';
import { EntityType } from '@volontariapp/contracts-nest';
import { GenerateUploadUrlRequestDTO } from '../../../../modules/storage/dto/request/index.js';

const buildDto = (overrides: Partial<GenerateUploadUrlRequestDTO> = {}) => {
  const dto = new GenerateUploadUrlRequestDTO();
  dto.mimeType = 'image/jpeg';
  dto.sizeBytes = 1024;
  dto.entityType = EntityType.ENTITY_TYPE_USER_AVATAR;
  return Object.assign(dto, overrides);
};

describe('GenerateUploadUrlRequestDTO (Unit)', () => {
  it('should accept a valid request', async () => {
    expect(await validate(buildDto())).toHaveLength(0);
  });

  it('should reject the unspecified entity type', async () => {
    const errors = await validate(buildDto({ entityType: EntityType.ENTITY_TYPE_UNSPECIFIED }));

    expect(errors.some((e) => e.property === 'entityType')).toBe(true);
  });

  it('should reject a non-positive size', async () => {
    const errors = await validate(buildDto({ sizeBytes: 0 }));

    expect(errors.some((e) => e.property === 'sizeBytes')).toBe(true);
  });

  it('should reject an empty mime type', async () => {
    const errors = await validate(buildDto({ mimeType: '' }));

    expect(errors.some((e) => e.property === 'mimeType')).toBe(true);
  });

  it('should build a command with the deprecated isPublic flag set to false', () => {
    expect(buildDto().toCommand()).toEqual({
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      entityType: EntityType.ENTITY_TYPE_USER_AVATAR,
      isPublic: false,
    });
  });
});
