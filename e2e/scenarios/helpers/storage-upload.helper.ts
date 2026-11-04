import type {
  ConfirmUploadWebResponse,
  FileMetadataWebResponse,
  GenerateUploadUrlWebResponse,
} from '@volontariapp/contracts';
import { FileStatus, ScanStatus, type EntityType } from '@volontariapp/contracts-nest';
import { eventually } from '../../helpers/eventually.helper.js';
import type { TestClient } from '../../helpers/test-client.helper.js';
import {
  TINY_PNG_MIME_TYPE,
  tinyPngFactory,
  uploadUrlRequestFactory,
} from '../../storage/storage-test.factory.js';

const FILE_READY_TIMEOUT_MS = 30_000;

/**
 * The gateway gRPC client decodes enums as names (`enums: String`, see the test factories of
 * src/test/helpers/factories), the generated types say numbers: compare through the name.
 */
function enumName(names: Record<number, string>, value: number | string): string {
  return typeof value === 'number' ? names[value] : value;
}

export const fileStatusName = (value: FileStatus): string => enumName(FileStatus, value);
export const scanStatusName = (value: ScanStatus): string => enumName(ScanStatus, value);

export const FILE_STATUS_ATTACHED = fileStatusName(FileStatus.FILE_STATUS_ATTACHED);
export const FILE_STATUS_ORPHANED = fileStatusName(FileStatus.FILE_STATUS_ORPHANED);
export const FILE_STATUS_DELETED = fileStatusName(FileStatus.FILE_STATUS_DELETED);

/**
 * Posts the file to the presigned POST target. The policy signs the form fields and not the host,
 * so when `E2E_S3_ORIGIN` is set (docker compose: `http://minio:9000`, the URL is signed for the
 * host-side `http://localhost:9000`) the same path is posted on that origin instead.
 */
async function postToObjectStore(
  upload: GenerateUploadUrlWebResponse,
  image: Buffer,
): Promise<void> {
  const signed = new URL(upload.uploadUrl);
  const s3Origin = process.env.E2E_S3_ORIGIN;
  const target = s3Origin ? new URL(`${signed.pathname}${signed.search}`, s3Origin) : signed;

  // S3 reads the form in order: every policy field first, the `file` part last.
  const form = new FormData();
  for (const [name, value] of Object.entries(upload.uploadFields)) {
    form.append(name, value);
  }
  form.append('file', new Blob([new Uint8Array(image)], { type: TINY_PNG_MIME_TYPE }), 'tiny.png');

  const res = await fetch(target, { method: 'POST', body: form });
  if (!res.ok) {
    throw new Error(
      `Object store refused the upload to ${target.origin}${target.pathname}: ${String(res.status)} ${await res.text()}`,
    );
  }
}

/**
 * Status of an anonymous GET on the public URL of a file (the public bucket allows anonymous
 * reads). The URL is built for the host side (`localhost:9000`): read it through `E2E_S3_ORIGIN`.
 */
export async function readPublicObjectStatus(publicUrl: string): Promise<number> {
  const url = new URL(publicUrl);
  const s3Origin = process.env.E2E_S3_ORIGIN;
  const target = s3Origin ? new URL(`${url.pathname}${url.search}`, s3Origin) : url;
  const res = await fetch(target);
  return res.status;
}

/** Reads the metadata of a file as its owner: the status code and, when found, the file. */
export async function readFile(
  owner: TestClient,
  fileId: string,
): Promise<{ status: number; file?: FileMetadataWebResponse['file'] }> {
  const res = await owner.get(`/api/v1/storage/files/${fileId}`);
  return {
    status: res.status,
    file: res.status === 200 ? (res.body as FileMetadataWebResponse).file : undefined,
  };
}

/** Polls the file until its status is one of `statuses` (names of `FileStatus`). */
export async function waitForFileStatus(
  owner: TestClient,
  fileId: string,
  statuses: readonly string[],
  timeoutMs: number,
): Promise<void> {
  await eventually(
    () => readFile(owner, fileId),
    (read) => read.file !== undefined && statuses.includes(fileStatusName(read.file.status)),
    { timeoutMs, description: `file ${fileId} in status ${statuses.join(' or ')}` },
  );
}

/**
 * Declares, uploads and confirms one tiny PNG as `owner` and returns its id once the scan is CLEAN.
 * The file is 70 bytes, far below the synchronous threshold (1 MB) of every entity type: confirm
 * answers CLEAN at once; the poll only covers an ASYNC fallback (SCANNING).
 */
export async function uploadConfirmedImage(
  owner: TestClient,
  entityType: EntityType,
): Promise<string> {
  const image = tinyPngFactory();
  const declared = await owner
    .post('/api/v1/storage/upload-url')
    .send(uploadUrlRequestFactory(entityType))
    .expect(201);
  const upload = declared.body as GenerateUploadUrlWebResponse;

  await postToObjectStore(upload, image);

  const confirmed = await owner.post(`/api/v1/storage/files/${upload.fileId}/confirm`).expect(200);
  const confirmedFile = (confirmed.body as ConfirmUploadWebResponse).file;
  if (scanStatusName(confirmedFile.scanStatus) !== scanStatusName(ScanStatus.SCAN_STATUS_CLEAN)) {
    await eventually(
      () => readFile(owner, upload.fileId),
      (read) =>
        read.file !== undefined &&
        scanStatusName(read.file.scanStatus) === scanStatusName(ScanStatus.SCAN_STATUS_CLEAN),
      { timeoutMs: FILE_READY_TIMEOUT_MS, description: `scan of file ${upload.fileId} CLEAN` },
    );
  }
  return upload.fileId;
}
