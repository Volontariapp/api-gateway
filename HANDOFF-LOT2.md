# Handoff: E2E lot 2 (event, post and ranking async flows)

Branches: `feat/e2e-lot2-event-post` in ci-tools (PR #72) and api-gateway. Delete this file before merging.

## Done

- ci-tools (`a262f4b`): e2e profile gains outbox-event, outbox-post, outbox-ranking, post-processor-ranking and worker-ranking. ms-ranking is added (PORT 3007, `MS_RANKING_URL=ms-ranking:5007` in `x-grpc-routing`, api-gateway depends on it). ms-ranking-migration joins the migrations profile. The `x-ranking-env` anchor sets debounce 0, a shared location key and JEV disabled. api-gateway-e2e gets `E2E_RANKING_ENABLED=true`. Every image was checked on GHCR first. `config -q` passes.
- post-processor-event is left out on purpose. In NODE_ENV=test its geocoder writes fixed Paris coordinates over every event location (`domain-event/.../open-street-map.strategy.ts:43-45`), which would break event-search.
- api-gateway:
  - New specs: `e2e/async/event-social-node`, `post-social-node` and `ranking-feed` (cold start 206 then 200; follower feed updated by the post.created fan-out).
  - Shared waits live in `e2e/helpers/social-node.helper.ts`.
  - These racing manual node creations were replaced by waits on the pipeline (all of them used ids of real events): event-search.helper createPublishedEvent (the `/own` link to organizerId stays manual because the creator is the admin), event-me pagination, event-lifecycle currentParticipants, and event-posts-test.helpers createEventWithSocialNode.
  - Nodes with random ids stay manual: user-social, social-relations, social-comprehensive-flows, posts-like-summary, and the posts of event-posts.
  - Setup now runs in parallel: event-search users and events, and event-me with its 25 events.
  - The ranking refresh-throttle test now sends its 6 requests together and expects exactly 1 throttled.
- Event-search test 21 flake. Root cause found in the diagnostics of ms-storage run 41805861790, `ms-event.log`: `GrpcValidation: Validation failed for SearchEventsQueryDTO: each value in ids must be a UUID` (trace b6876bd4, mainUser). So ms-social returned a recommended event id that is not a UUID. Every event id logged by ms-social was a UUID, so the bad value is most likely an empty eventId. This is an inference, not verified: a SocialEvent node read by the unbounded `MATCH (e:SocialEvent)` while a concurrent test DETACH DELETEs it. The fix in this PR: `listEvents` drops non-UUID ids and logs a warn. It has unit tests, and IdsPageFactory now produces UUID-shaped ids.

## Validated

- Lint (eslint and prettier) passes on all changed files. Unit tests for event.query-controller, fetch-all-pages and ranking-blocks pass (15 tests).
- Local stack (Docker VM with 10 GB and 5 CPUs; every GHCR image runs under amd64 emulation): the 3 new async specs PASS. Many existing specs time out locally from CPU starvation (event-search beforeAll, social-relations, post-lifecycle and others). Run 1 also had neo4j OOM-killed. The local validation is therefore inconclusive. The full suite has not been run twice green.
- CI: not run yet.

## Remains / next steps

1. Push the api-gateway branch if this push did not land, open the PR with the label `docker-and-e2e`, and watch `gh pr checks <n> -R Volontariapp/api-gateway`.
2. Re-run the setups that changed since the last local run: event-me parallel creation, ranking throttle, and event-search parallel setup.
3. Prove that each new async spec can fail by stopping post-processor-social (event/post specs) and post-processor-ranking (ranking-feed fan-out). Not done yet.
4. Merge order: ci-tools PR #72, then sync-all (submodule pointers), then api-gateway. A repo whose ci-tools predates #72 lacks outbox-event/post and would fail the new async specs. The ranking specs are gated by E2E_RANKING_ENABLED.

## Known risks and follow-ups (not done, need npm-packages or other repos)

- Real bug: the gateway `fetchAllPages` reads up to 10,000 recommended ids, but ms-event caps `ids` at 1000 (`MAX_SEARCH_IDS`). Above 1000 recommended events, every social-filtered search returns 400. With lot 2 every real event gets a node, so the graph grows faster.
- Root fix for the empty id: domain-social `getRecommendedEventIds` should filter `e.eventId IS NOT NULL` (npm-packages, STOP rule).
- An EVENT_CREATED fan-out requests a compute for every active user (up to maxFanout 1000), which loads worker-ranking during the e2e run.
- The event.created gather in ws-service expects GEOCODED_SUCCESS, which nothing emits in the stack (post-processor-event is absent), so each event saga ends as failed after 60 s. This is harmless because nobody consumes the failure without post-processor-event.
- Run 1 logged one `No mapping registered from JobsOutboxEntity to JobsOutboxModel` (a withFallback path) while neo4j was down. Not investigated.
