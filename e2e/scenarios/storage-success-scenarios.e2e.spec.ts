import type { PostWebResponse } from '@volontariapp/contracts';
import { EntityType } from '@volontariapp/contracts-nest';
import type { UserResponseDTO } from '../../src/modules/user/dto/response/index.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { eventually } from '../helpers/eventually.helper.js';
import { createPost } from '../post/post-test.helpers.js';
import {
  largePngFactory,
  ONE_MEGABYTE,
  uploadUrlRequestFactory,
} from '../storage/storage-test.factory.js';
import type { ScenarioActor } from './helpers/scenario-world.helper.js';
import { ScenarioWorld } from './helpers/scenario-world.helper.js';
import {
  confirmImageUpload,
  FILE_STATUS_ATTACHED,
  readPublicObjectStatus,
  SCAN_STATUS_CLEAN,
  uploadConfirmedImage,
  waitForFileStatus,
} from './helpers/storage-upload.helper.js';

const SETUP_TIMEOUT_MS = 120_000;
const ATTACHMENT_TIMEOUT_MS = 60_000;
/** The scan of a file above 1 MB goes through outbox, BullMQ and worker-storage. */
const ASYNC_SCAN_TIMEOUT_MS = 120_000;
const TEST_TIMEOUT_MS = 120_000;
const ASYNC_TEST_TIMEOUT_MS = 240_000;

async function readPost(client: TestClient, postId: string): Promise<PostWebResponse['post']> {
  const res = await client.get(`/api/v1/posts/${postId}`).expect(200);
  return (res.body as PostWebResponse).post;
}

/**
 * Success paths of the file storage, the first three criteria of
 * docs/stockage-fichiers/10-plan-implementation.md (the failure paths are in the other storage
 * scenarios).
 *   Avatar: always SYNC, 1 MB maximum. A bigger file is refused when the upload is declared.
 *   Post, 1 MB or less: SYNC, the scan is done when `confirm` answers, the post is READY at once.
 *   Post, above 1 MB: ASYNC, `worker-storage` scans the file, the post stays PENDING (hidden from
 *     everyone but its author) until the scan result reaches it.
 */
describe('Scenarios: storage success paths (E2E)', () => {
  let world: ScenarioWorld;
  let author: ScenarioActor;
  let reader: ScenarioActor;

  beforeAll(async () => {
    world = await ScenarioWorld.open();
    [author, reader] = await world.signUpMany(2);
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await world.close();
  });

  describe('avatar (SYNC only)', () => {
    it(
      'an avatar of 1 MB or less is CLEAN at confirm, attached by the profile update and served',
      async () => {
        const upload = await confirmImageUpload(author.client, EntityType.ENTITY_TYPE_USER_AVATAR);
        expect(upload.scanStatus).toBe(SCAN_STATUS_CLEAN);

        const updated = await author.client
          .patch('/api/v1/users/me')
          .send({ avatarFileId: upload.fileId })
          .expect(200);
        const avatarUrl = (updated.body as UserResponseDTO).user.avatarUrl;
        if (!avatarUrl) {
          throw new Error(`the profile has no avatarUrl after attaching file ${upload.fileId}`);
        }

        const profile = await author.client.get('/api/v1/users/me').expect(200);
        expect((profile.body as UserResponseDTO).user.avatarUrl).toBe(avatarUrl);

        await waitForFileStatus(
          author.client,
          upload.fileId,
          [FILE_STATUS_ATTACHED],
          ATTACHMENT_TIMEOUT_MS,
        );
        expect(await readPublicObjectStatus(avatarUrl)).toBe(200);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'an avatar above 1 MB is refused with a 400 when the upload is declared',
      async () => {
        await author.client
          .post('/api/v1/storage/upload-url')
          .send(
            uploadUrlRequestFactory(EntityType.ENTITY_TYPE_USER_AVATAR, {
              sizeBytes: ONE_MEGABYTE + 1,
            }),
          )
          .expect(400);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('post', () => {
    it(
      'a post with an image of 1 MB or less is READY at creation and visible to everyone',
      async () => {
        const fileId = await uploadConfirmedImage(author.client, EntityType.ENTITY_TYPE_POST);

        const { postId, post } = await createPost(author.client, { fileIds: [fileId] });
        expect(post.mediaStatus).toBe('READY');
        expect(post.media).toHaveLength(1);

        const seenByReader = await readPost(reader.client, postId);
        expect(seenByReader.mediaStatus).toBe('READY');
        expect(seenByReader.media?.[0]?.fileId).toBe(fileId);
      },
      TEST_TIMEOUT_MS,
    );

    // This scenario found two gaps in the ASYNC path.
    //  1. Fixed: worker-storage could not write the scan result (EventQueueModel missing from its
    //     data source, workers-runners#67).
    //  2. Open: domain-storage writes storage.file_scanned with no target stream
    //     (FILE_SCAN_RESULT_TARGET_SERVICES = [] in file-outbox.builders.ts), so the outbox pusher
    //     skips it ("has no target services, skipping push") and post-processor-post never marks
    //     the post READY.
    // `it.failing` until domain-storage names the streams and worker-storage runs that version;
    // then turn it into `it`.
    it.failing(
      'a post with an image above 1 MB is PENDING and hidden, then READY once worker-storage scanned it',
      async () => {
        const image = largePngFactory();
        expect(image.length).toBeGreaterThan(ONE_MEGABYTE);
        const upload = await confirmImageUpload(author.client, EntityType.ENTITY_TYPE_POST, image);

        const { postId, post } = await createPost(author.client, { fileIds: [upload.fileId] });
        expect(post.mediaStatus).toBe('PENDING');

        // The status only moves from PENDING to READY. If the author still reads PENDING after the
        // reader's call, the reader's call was made while the post was PENDING and must be refused.
        const readerView = await reader.client.get(`/api/v1/posts/${postId}`);
        const authorView = await readPost(author.client, postId);
        const hiddenWhilePending =
          authorView.mediaStatus !== 'PENDING' || readerView.status === 404;
        expect(hiddenWhilePending).toBe(true);

        const ready = await eventually(
          () => readPost(author.client, postId),
          (read) => read.mediaStatus === 'READY',
          {
            timeoutMs: ASYNC_SCAN_TIMEOUT_MS,
            description: `post ${postId} READY after the scan of file ${upload.fileId}`,
          },
        );
        const mediaUrl = ready.media?.[0]?.url;
        if (!mediaUrl) {
          throw new Error(`post ${postId} is READY but its media has no url`);
        }
        expect(await readPublicObjectStatus(mediaUrl)).toBe(200);

        const seenByReader = await readPost(reader.client, postId);
        expect(seenByReader.mediaStatus).toBe('READY');
      },
      ASYNC_TEST_TIMEOUT_MS,
    );
  });
});
