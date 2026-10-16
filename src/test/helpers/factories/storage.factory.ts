import {
  EntityType,
  FileStatus,
  ScanStatus,
  ValidationMode,
  type ConfirmUploadResponse,
  type FileMetadata,
  type FileMetadataResponse,
  type GenerateUploadUrlResponse,
} from '@volontariapp/contracts-nest';

export const FILE_ID = '5d0e4a3c-7f0b-4b76-9a52-0d1f4f3b9e11';
export const OWNER_ID = '76c5b964-b5a1-43e3-85e2-040683457e56';

export const createFileMetadataFactory = (overrides: Partial<FileMetadata> = {}): FileMetadata => ({
  id: FILE_ID,
  ownerId: OWNER_ID,
  objectKey: '',
  mimeType: 'image/jpeg',
  status: FileStatus.FILE_STATUS_PENDING,
  entityType: EntityType.ENTITY_TYPE_USER_AVATAR,
  entityId: undefined,
  isPublic: false,
  uploadExpiresAt: { seconds: 1_800_000_900, nanos: 0 },
  createdAt: { seconds: 1_800_000_000, nanos: 0 },
  updatedAt: { seconds: 1_800_000_100, nanos: 0 },
  scanStatus: ScanStatus.SCAN_STATUS_SCANNING,
  rejectionReason: undefined,
  publicUrl: undefined,
  validationMode: ValidationMode.VALIDATION_MODE_ASYNC,
  ...overrides,
});

export const createGenerateUploadUrlResponseFactory = (
  overrides: Partial<GenerateUploadUrlResponse> = {},
): GenerateUploadUrlResponse => ({
  fileId: FILE_ID,
  uploadUrl: 'https://storage.example.test/quarantine',
  expiresAt: { seconds: 1_800_000_900, nanos: 0 },
  uploadFields: { key: `quarantine/${FILE_ID}`, policy: 'signed-policy' },
  ...overrides,
});

export const createConfirmUploadResponseFactory = (
  overrides: Partial<ConfirmUploadResponse> = {},
): ConfirmUploadResponse => ({
  file: createFileMetadataFactory(),
  ...overrides,
});

export const createFileMetadataResponseFactory = (
  overrides: Partial<FileMetadataResponse> = {},
): FileMetadataResponse => ({
  file: createFileMetadataFactory(),
  ...overrides,
});
