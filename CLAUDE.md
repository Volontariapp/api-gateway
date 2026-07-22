# api-gateway

NestJS REST gateway (no GraphQL in this repo). Contexte archi global (DDD/CQRS/token
interne) : voir `.agents/skills/domain/backend-architecture/SKILL.md` à la racine du repo
meta — non répété ici.

## Routes REST -> microservice

- `POST/PATCH/DELETE /users`, `GET /users/me`, `GET /users/:userId/public` -> **ms-user**
  (`src/modules/user`, `BaseUserGrpcController` -> `UserServiceClient`)
- `GET /badges*` -> **ms-user** (`BaseBadgeGrpcController`)
- `POST /users/login`, `/users/refresh` (public, `user-auth.controller.ts`) -> **ms-user**
- `/posts`, `/posts/:postId/comments` -> **ms-post** (`src/modules/post`,
  `BasePostGrpcController` -> `PostServiceClient`)
- `/events`, `/events/:id/requirements`, `/tags` -> **ms-event** (`src/modules/event`)
- `/social/*` (likes, follow/block, participate/wish, feed, event-post links) -> **ms-social**
  (`src/modules/social`, plusieurs controllers commands/queries + `event-post-link.controller.ts`)
- `/system/seed` -> seed interne (dev/test uniquement, `system-seed.controller.ts`)
- `/health` -> health checks locaux
- `/helpers/tokens/*` (`@Public()`) -> génère des tokens de test (access/refresh/internal/admin),
  monté uniquement si `nodeEnv !== TEST` (`src/modules/helper`)
- WebSocket : `WsProxyMiddleware` (`src/modules/ws-proxy`) proxy HTTP/WS brut vers `msWsUrl`
  (pas de contrôleur REST, auth via `JwtService` avant proxying)

Chaque module REST expose des controllers séparés `commands/` (write) et `queries/` (read),
plus des variantes `*-admin.*-controller.ts` (protégées par `GatewayController(tag, { admin: true })`).

## Auth et token interne (implémentation réelle)

Toute la logique (guards, interceptor, JwtService) vient du package externe
`@volontariapp/auth` (v3.3.9) — **rien n'est réimplémenté dans ce repo**, seulement consommé :

- `GatewayController(tag, options)` (`src/common/decorators/gateway-controller.decorator.ts`)
  applique `UseGuards(AccessTokenGuard)` (ou `+ RolesGuard` si `admin: true`) sur chaque
  controller. `AccessTokenGuard` vérifie le JWT access/refresh token.
- `GrpcInternalInterceptor` (de `@volontariapp/auth`) est enregistré globalement en
  `APP_INTERCEPTOR` dans `AppModule.register()` (`src/app.module.ts`). Il génère le token
  interne et pose `req['internalMetadata']` (un objet `grpc.Metadata`) sur la requête.
- Les controllers récupèrent ce metadata (`req['internalMetadata'] as Metadata`) et le passent
  en second argument de chaque appel gRPC (ex: `this.userService.updateUser(cmd, metadata)`).
- `IsCurrentUserOrAdminGuard` (`src/common/guards/is-current-user-or-admin.guard.ts`) est un
  guard maison additionnel : autorise si `user.role === ADMIN` ou `user.id === params.userId`.
- `TokenHelperController` (`/helpers/tokens/*`) expose `jwtService.signAccessToken`,
  `signRefreshToken`, `signInternal` pour générer des tokens de test — désactivé si
  `nodeEnv === TEST`.

## Clients gRPC

- Un seul `GrpcClientModule` global (`src/grpc/grpc-client.module.ts`) enregistre 4 clients via
  `ClientsModule.registerAsync` : `USER_PACKAGE`, `POST_PACKAGE`, `EVENT_PACKAGE`,
  `SOCIAL_PACKAGE` (noms dans `src/grpc/grpc-packages.ts`).
- Options générées par `getGrpcOptions(GRPC_MICROSERVICES.X, url)` du package
  `@volontariapp/contracts-nest`, avec l'URL lue depuis `AppConfigService`
  (`config.microServices.msUserUrl/msPostUrl/msEventUrl/msSocialUrl`).
- Chaque module a un `Base*GrpcController` (`base-user-grpc.controller.ts`,
  `base-badge-grpc.controller.ts`, `base-post-grpc.controller.ts`, etc.) qui fait
  `client.getService<XServiceClient>(X_SERVICE_NAME)` dans `onModuleInit` — les controllers
  concrets héritent de cette base pour accéder au service typé.
- `ms-social` (temps réel) n'a pas de client gRPC ici : le WS est proxyé en HTTP/WS brut via
  `WsProxyMiddleware` vers `config.microServices.msWsUrl`, pas via gRPC.

## Contraintes vues dans le code

- `HelperModule` (génération de tokens) n'est jamais monté en environnement `TEST`.
- Toutes les routes REST déclarées avec `@GatewayController` exigent un access token sauf
  celles marquées `@Public()` (auth login/refresh, helpers/tokens).
- Les routes "me" (`/users/me`, `/posts/me`, `/social/feed/me`, etc.) utilisent
  `@CurrentUser()` (déduit du JWT) plutôt qu'un paramètre d'URL.
- Les routes `:userId`-scopées protégées par `IsCurrentUserOrAdminGuard` n'autorisent que le
  propriétaire ou un ADMIN.

## 🚀 RTK - Rust Token Killer (Optimized)

All shell commands (`git`, `npm`, `jest`, etc.) are automatically proxied via `rtk` for 80% token savings.

- **Direct Usage:** `rtk gain` (analytics), `rtk discover` (missed savings).
- **Files:** Use `rtk read <file>`, `rtk ls`, `rtk find`, `rtk grep` for compressed agent output.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
