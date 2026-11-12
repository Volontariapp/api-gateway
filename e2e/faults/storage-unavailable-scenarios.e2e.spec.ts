import type { EventWebResponse, PostWebResponse } from '@volontariapp/contracts';
import { EntityType } from '@volontariapp/contracts-nest';
import { createEventRequestFactory } from '../event/event-test.factory.js';
import { eventually } from '../helpers/eventually.helper.js';
import { isFaultInjectionAvailable, restoreAll, withCut } from '../helpers/network-fault.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createPost } from '../post/post-test.helpers.js';
import type { ScenarioActor } from '../scenarios/helpers/scenario-world.helper.js';
import { ScenarioWorld } from '../scenarios/helpers/scenario-world.helper.js';
import {
  FILE_STATUS_ATTACHED,
  fileStatusName,
  readFile,
  uploadConfirmedImage,
  waitForFileStatus,
} from '../scenarios/helpers/storage-upload.helper.js';

const SETUP_TIMEOUT_MS = 120_000;
const TEST_TIMEOUT_MS = 180_000;
/** outbox -> Redis -> post-processor-storage -> outbox -> Redis -> post-processor-event / -post. */
const ASYNC_ATTACHMENT_TIMEOUT_MS = 90_000;

/** The link of the service that attaches the file to its entity, towards ms-storage. */
const EVENT_TO_STORAGE = ['ms-event', 'ms-storage'] as const;
const POST_TO_STORAGE = ['ms-post', 'ms-storage'] as const;

type EventRead = EventWebResponse['event'];
type PostRead = PostWebResponse['post'];

async function createEventWithCover(client: TestClient, coverFileId: string): Promise<EventRead> {
  const res = await client
    .post('/api/v1/events')
    .send(createEventRequestFactory({ coverFileId }))
    .expect(201);
  return (res.body as EventWebResponse).event;
}

async function readEvent(client: TestClient, eventId: string): Promise<EventRead> {
  const res = await client.get(`/api/v1/events/${eventId}`).expect(200);
  return (res.body as EventWebResponse).event;
}

async function readPost(client: TestClient, postId: string): Promise<PostRead> {
  const res = await client.get(`/api/v1/posts/${postId}`).expect(200);
  return (res.body as PostWebResponse).post;
}

/**
 * Asynchronous attachment when ms-storage is down, the reference scenario of
 * docs/stockage-fichiers/11-scenarios-de-panne.md (section 1).
 *
 * The photo is uploaded and confirmed while ms-storage is up (a file of 1 MB or less is scanned
 * synchronously and is CLEAN). The link of the service that creates the entity (ms-event or
 * ms-post) towards ms-storage is then cut: its `ConfirmFileAttachment` fails, so the entity is
 * created with a PENDING photo instead of an error. post-processor-storage then attaches the file
 * (it reads the ms_storage database, not the service) and emits `storage.file_scanned`, and
 * post-processor-event / -post moves the photo to READY. The link stays cut until the end of the
 * wait, to prove that nothing after the creation needs ms-storage.
 *
 * Cutting a link cuts it for every test running at that time: these suites run alone, after the
 * parallel pass (scripts/run-e2e.sh).
 */
if (!isFaultInjectionAvailable()) {
  // The compose of this checkout of ci-tools has no toxiproxy: registered, never silently skipped.
  describe('fault injection (needs toxiproxy in the stack)', () => {
    it.todo('an event created with a cover while ms-storage is down is PENDING, then READY');
    it.todo('a post created with an image while ms-storage is down is PENDING, then READY');
    it.todo('an event created with the file of another user while ms-storage is down is REJECTED');
  });
} else {
  describe('Scenarios: ms-storage unavailable at creation (E2E)', () => {
    let world: ScenarioWorld;
    let organizer: ScenarioActor;
    let stranger: ScenarioActor;

    beforeAll(async () => {
      // A previous run that crashed may have left a link cut.
      await restoreAll();
      world = await ScenarioWorld.open();
      [organizer, stranger] = await world.signUpMany(2);
    }, SETUP_TIMEOUT_MS);

    afterAll(async () => {
      await restoreAll();
      await world.close();
    });

    it(
      'an event created with a cover while ms-storage is down is PENDING, then READY',
      async () => {
        const coverFileId = await uploadConfirmedImage(
          organizer.client,
          EntityType.ENTITY_TYPE_EVENT_COVER,
        );

        await withCut(...EVENT_TO_STORAGE, async () => {
          const created = await createEventWithCover(organizer.client, coverFileId);
          expect(created.coverStatus).toBe('PENDING');
          expect(created.coverUrl).toBeUndefined();

          // The event is visible: PENDING, or READY if the pipeline already went through.
          const seen = await readEvent(organizer.client, created.id);
          expect(['PENDING', 'READY']).toContain(seen.coverStatus);

          const ready = await eventually(
            () => readEvent(organizer.client, created.id),
            (read) => read.coverStatus === 'READY',
            {
              timeoutMs: ASYNC_ATTACHMENT_TIMEOUT_MS,
              description: `event ${created.id} cover READY while ms-storage is cut`,
            },
          );
          expect(ready.coverUrl).toEqual(expect.any(String));
        });

        await waitForFileStatus(
          organizer.client,
          coverFileId,
          [FILE_STATUS_ATTACHED],
          ASYNC_ATTACHMENT_TIMEOUT_MS,
        );
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'a post created with an image while ms-storage is down is PENDING, then READY',
      async () => {
        const fileId = await uploadConfirmedImage(organizer.client, EntityType.ENTITY_TYPE_POST);

        await withCut(...POST_TO_STORAGE, async () => {
          const { postId, post } = await createPost(organizer.client, { fileIds: [fileId] });
          expect(post.mediaStatus).toBe('PENDING');

          const ready = await eventually(
            () => readPost(organizer.client, postId),
            (read) => read.mediaStatus === 'READY',
            {
              timeoutMs: ASYNC_ATTACHMENT_TIMEOUT_MS,
              description: `post ${postId} media READY while ms-storage is cut`,
            },
          );
          expect(ready.media).toHaveLength(1);
          expect(ready.media?.[0]?.fileId).toBe(fileId);
        });

        await waitForFileStatus(
          organizer.client,
          fileId,
          [FILE_STATUS_ATTACHED],
          ASYNC_ATTACHMENT_TIMEOUT_MS,
        );
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'an event created with the file of another user while ms-storage is down ends REJECTED and never shows it',
      async () => {
        const foreignFileId = await uploadConfirmedImage(
          stranger.client,
          EntityType.ENTITY_TYPE_EVENT_COVER,
        );

        await withCut(...EVENT_TO_STORAGE, async () => {
          const created = await createEventWithCover(organizer.client, foreignFileId);
          expect(created.coverStatus).toBe('PENDING');

          // The cover is never displayed: no read, before or after the verdict, carries a URL.
          const observed: EventRead[] = [];
          const rejected = await eventually(
            async () => {
              const read = await readEvent(organizer.client, created.id);
              observed.push(read);
              return read;
            },
            (read) => read.coverStatus === 'REJECTED',
            {
              timeoutMs: ASYNC_ATTACHMENT_TIMEOUT_MS,
              description: `event ${created.id} cover REJECTED (file of another user)`,
            },
          );
          expect(rejected.coverUrl).toBeUndefined();
          expect(observed.filter((read) => read.coverUrl !== undefined)).toEqual([]);
          expect(observed.filter((read) => read.coverStatus === 'READY')).toEqual([]);
        });

        // The file was not taken by the organizer's event: it is not attached to anything.
        const { file } = await readFile(stranger.client, foreignFileId);
        if (!file) {
          throw new Error(`file ${foreignFileId} of the other user cannot be read by its owner`);
        }
        expect(fileStatusName(file.status)).not.toBe(FILE_STATUS_ATTACHED);
      },
      TEST_TIMEOUT_MS,
    );
  });
}
