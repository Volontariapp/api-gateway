import { EntityType } from '@volontariapp/contracts-nest';
import { eventually } from '../helpers/eventually.helper.js';
import { createPost } from '../post/post-test.helpers.js';
import type { ScenarioActor } from './helpers/scenario-world.helper.js';
import { ScenarioWorld } from './helpers/scenario-world.helper.js';
import {
  FILE_STATUS_ATTACHED,
  FILE_STATUS_DELETED,
  FILE_STATUS_ORPHANED,
  fileStatusName,
  readFile,
  readPublicObjectStatus,
  uploadConfirmedImage,
  waitForFileStatus,
} from './helpers/storage-upload.helper.js';

/** Two uploads, a post, two profile updates and their attachments chained. */
const SETUP_TIMEOUT_MS = 180_000;
const ATTACHMENT_TIMEOUT_MS = 60_000;
const RELEASE_WAIT_MS = 60_000;
const TEST_TIMEOUT_MS = 120_000;

/** A file released by one of these flows, with its public URL read while it was attached. */
interface ReleasedFile {
  readonly label: string;
  readonly fileId: string;
  readonly publicUrl: string;
  /** Status of an anonymous GET on `publicUrl` while the file was attached. */
  readonly statusWhileAttached: number;
}

async function readAttachedPublicFile(
  owner: ScenarioActor,
  label: string,
  fileId: string,
): Promise<ReleasedFile> {
  await waitForFileStatus(owner.client, fileId, [FILE_STATUS_ATTACHED], ATTACHMENT_TIMEOUT_MS);
  const publicUrl = (await readFile(owner.client, fileId)).file?.publicUrl;
  if (!publicUrl) {
    throw new Error(`${label} ${fileId} has no public URL once attached and CLEAN`);
  }
  return { label, fileId, publicUrl, statusWhileAttached: await readPublicObjectStatus(publicUrl) };
}

/**
 * Files released by an entity, not by an account deletion (catalogue: e2e/scenarios/README.md, G9).
 *   post.deleted: ms-post -> outbox-post -> post-processor-storage releaseForEntity (ORPHANED).
 *   user.avatar_replaced: ms-user -> outbox-user -> post-processor-storage releaseFile (ORPHANED).
 *   Purge: a storage.cleanup_files job (jobs_outbox of ms-storage) -> outbox-storage -> BullMQ
 *     -> worker-storage CleanupFilesHandler deletes the objects and marks the rows DELETED.
 */
describe('Scenarios: files released by a post or a profile (E2E)', () => {
  let world: ScenarioWorld;
  let author: ScenarioActor;
  let postMedia: ReleasedFile;
  let oldAvatar: ReleasedFile;

  beforeAll(async () => {
    world = await ScenarioWorld.open();
    author = await world.signUp();

    // A post with one media, then deleted.
    const postMediaFileId = await uploadConfirmedImage(author.client, EntityType.ENTITY_TYPE_POST);
    const { postId } = await createPost(author.client, { fileIds: [postMediaFileId] });
    postMedia = await readAttachedPublicFile(author, 'post media', postMediaFileId);

    // An avatar, then replaced by another one.
    const firstAvatarId = await uploadConfirmedImage(
      author.client,
      EntityType.ENTITY_TYPE_USER_AVATAR,
    );
    await author.client.patch('/api/v1/users/me').send({ avatarFileId: firstAvatarId }).expect(200);
    oldAvatar = await readAttachedPublicFile(author, 'replaced avatar', firstAvatarId);
    const secondAvatarId = await uploadConfirmedImage(
      author.client,
      EntityType.ENTITY_TYPE_USER_AVATAR,
    );
    await author.client
      .patch('/api/v1/users/me')
      .send({ avatarFileId: secondAvatarId })
      .expect(200);

    await author.client.delete(`/api/v1/posts/${postId}`).expect(200);
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await world.close();
  });

  it(
    'the media of a deleted post and a replaced avatar are released',
    async () => {
      for (const file of [postMedia, oldAvatar]) {
        expect(file.statusWhileAttached).toBe(200);
        await eventually(
          () => readFile(author.client, file.fileId),
          (read) =>
            read.status === 404 ||
            (read.file !== undefined &&
              [FILE_STATUS_ORPHANED, FILE_STATUS_DELETED].includes(
                fileStatusName(read.file.status),
              )),
          { timeoutMs: RELEASE_WAIT_MS, description: `${file.label} ${file.fileId} released` },
        );
      }
    },
    TEST_TIMEOUT_MS,
  );

  // Gap G9 (README): releaseForEntity and releaseFile move the files to ORPHANED without writing a
  // storage.cleanup_files job, so nothing purges them and their public URLs keep answering 200.
  it.failing(
    'G9: the media of a deleted post and a replaced avatar are purged, no longer downloadable',
    async () => {
      for (const file of [postMedia, oldAvatar]) {
        await eventually(
          () => readPublicObjectStatus(file.publicUrl),
          (status) => status === 404 || status === 403,
          {
            timeoutMs: RELEASE_WAIT_MS,
            description: `public object of ${file.label} ${file.fileId} removed`,
          },
        );
        await eventually(
          () => readFile(author.client, file.fileId),
          (read) =>
            read.status === 404 ||
            (read.file !== undefined && fileStatusName(read.file.status) === FILE_STATUS_DELETED),
          { timeoutMs: RELEASE_WAIT_MS, description: `${file.label} ${file.fileId} DELETED` },
        );
      }
    },
    TEST_TIMEOUT_MS,
  );
});
