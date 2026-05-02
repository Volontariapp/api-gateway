# 🛠️ Guide d'Implémentation: Auth Migration userId → JWT + Role ADMIN

## 📋 Liste Complète des 27 Routes Impactées

### **Format standardisé:**

```
[CONTRÔLEUR] [ROUTE_PATH] [GUARD_REQUIS]
```

---

## 🔴 **SOCIAL MODULE**

### **A. SocialUserController** (`/social/users`)

**Urgence:** 🔴 CRITIQUE (3 routes)  
**Raison:** Admin-only internal operations

```typescript
// Route 1: Create user node
POST   /social/users/:userId
Guard: @Roles(Role.ADMIN)
Audit: Log who created which user node

// Route 2: Check user exists
GET    /social/users/:userId
Guard: @Roles(Role.ADMIN)
Audit: Log admin queries

// Route 3: Delete user node
DELETE /social/users/:userId
Guard: @Roles(Role.ADMIN)
Audit: Log who deleted which user node
```

**Checklist d'implémentation:**

- [ ] Ajouter `import { Roles } from '../../../common/decorators/roles.decorator'`
- [ ] Ajouter `@Roles(Role.ADMIN)` au-dessus de chaque méthode
- [ ] Tester avec JWT token admin: `curl -H "Authorization: Bearer <admin_token>" ...`

---

### **B. PublicationController** (`/social`)

**Urgence:** 🟡 HIGH (4 routes)  
**Raison:** Gestion de propriété + accès aux données

```typescript
// Route 4: Link user as post owner
POST   /social/users/:userId/posts/:postId/own
Guard: @Roles(Role.ADMIN) // Admin only
Audit: Log ownership changes

// Route 5: Unlink user from post
DELETE /social/users/:userId/posts/:postId/own
Guard: @Roles(Role.ADMIN) // Admin only
Audit: Log ownership removal

// Route 6: Get user posts
GET    /social/users/:userId/posts
Guard: @IsCurrentUserOrAdmin()
Logic:
  - Self can read own posts
  - Admin can read any user's posts
  - Others: 403 Forbidden

// Route 7: Get user feed
GET    /social/users/:userId/feed
Guard: @IsCurrentUserOrAdmin()
Logic: Same as route 6
```

**Implémentation étapes:**

```typescript
// Step 1: Create custom guard
// src/common/decorators/is-current-user-or-admin.decorator.ts
export function IsCurrentUserOrAdmin() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, IsCurrentUserOrAdminGuard),
  );
}

// Step 2: Apply to methods
@Get('users/:userId/posts')
@IsCurrentUserOrAdmin()
getUserPosts(@Param('userId') userId: string, ...) { ... }
```

---

### **C. RelationshipController** (`/social/users/:userId`) ⚠️ MOST COMPLEX

**Urgence:** 🔴 CRITIQUE (8 routes)  
**Raison:** Controller path contient userId → Redesign requis  
**Complexité:** HIGHEST

```typescript
// Routes 8-11: Mutations (follow/block/unblock)
POST   /social/users/:userId/follow/:followedId
DELETE /social/users/:userId/follow/:followedId
POST   /social/users/:userId/block/:blockedId
DELETE /social/users/:userId/block/:blockedId

Guard: @IsCurrentUserOrAdmin()
Logic:
  - userId du JWT MUST égal path param
  - OU user has Role.ADMIN
  - Sinon: 403 Forbidden

// Routes 12-15: Lectures (follows/followers/blocks/blocked)
GET    /social/users/:userId/follows
GET    /social/users/:userId/followers
GET    /social/users/:userId/blocks
GET    /social/users/:userId/who-blocked-me

Guard: @IsCurrentUserOrAdmin()
Logic: Same as mutations
```

**⚠️ Problème d'architecture:**
Le controller a `@Controller('social/users/:userId')` au niveau classe:

```typescript
// AVANT (problématique pour migration)
@Controller('social/users/:userId')
export class RelationshipController {
  @Post('follow/:followedId')
  follow(@Param('userId') userId, @Param('followedId') followedId) { ... }
}

// APRÈS (deux options)

// OPTION A: Modifier le path du controller
@Controller('social/users')
export class RelationshipController {
  @Post(':userId/follow/:followedId')
  follow(@Param('userId') userId, @Param('followedId') followedId) { ... }

  @Get(':userId/follows')
  getFollows(@Param('userId') userId) { ... }
}

// OPTION B: Garder le design, ajouter guard personnalisé
// (guard extract userId du JWT et valide path param)
@Controller('social/users/:userId')
@UseGuards(JwtAuthGuard, ValidatePathUserIdGuard)
export class RelationshipController { ... }
```

**Recommandation:** OPTION A (plus claire, plus testable)

---

### **D. ParticipationController** (`/social`) ⚠️ SECOND MOST COMPLEX

**Urgence:** 🔴 CRITIQUE (9 routes)  
**Raison:** Cycle de vie événement complexe

```typescript
// Routes 16-17: Créateur d'événement (admin only)
POST   /social/users/:userId/events/:eventId/own
DELETE /social/users/:userId/events/:eventId/own
Guard: @Roles(Role.ADMIN)

// Routes 18-19: Participation utilisateur
POST   /social/users/:userId/events/:eventId/participate
DELETE /social/users/:userId/events/:eventId/participate
Guard: @IsCurrentUserOrAdmin()
Logic:
  - userId du JWT MUST match path param
  - OU admin can operate on any user

// Routes 20-21: Read created/participated events
GET    /social/users/:userId/events/created
GET    /social/users/:userId/events/participated
Guard: @IsCurrentUserOrAdmin()

// Routes 22-23: Wishlist events
POST   /social/users/:userId/events/:eventId/wish
DELETE /social/users/:userId/events/:eventId/wish
Guard: @IsCurrentUserOrAdmin()

// Route 24: Read wished events
GET    /social/users/:userId/events/wished
Guard: @IsCurrentUserOrAdmin()
```

**Plan d'implémentation:**

1. Créer la guard `IsCurrentUserOrAdminGuard`
2. Appliquer à toutes les routes
3. Ajouter validation: path userId === JWT userId OU isAdmin
4. Ajouter logs d'audit pour accès cross-user

---

### **E. InteractionController** (`/social`)

**Urgence:** 🟡 MEDIUM (3 routes)  
**Raison:** Opérations simples self-service

```typescript
// Routes 25-26: Mutations (like/unlike)
POST   /social/users/:userId/likes/:postId
DELETE /social/users/:userId/likes/:postId
Guard: @IsCurrentUser()
Logic:
  - STRICT: userId du JWT MUST égal path param
  - No admin bypass pour éviter fraude
  - 403 si mismatch

// Route 27: Read user likes
GET    /social/users/:userId/likes
Guard: @IsCurrentUserOrAdmin()
Logic: Self-read + admin can read any user
```

**Validation stricte:**

```typescript
// Guard personnalisée pour likes
@UseGuards(JwtAuthGuard)
@Post('users/:userId/likes/:postId')
likePost(
  @Param('userId') pathUserId: string,
  @CurrentUser() jwt: JwtPayload,
) {
  if (pathUserId !== jwt.userId && jwt.role !== Role.ADMIN) {
    throw new ForbiddenException('Cannot like for other users');
  }
  // ... rest of logic
}
```

---

## 🔵 **EVENT MODULE**

**Status:** ✅ NO CHANGES REQUIRED

EventController uses event-centric routing (`/events/:id`), not user-centric.

---

## 📦 Infrastructure Required

### **1. Guards à créer**

```bash
# Si les fichiers existent mais sont vides
src/common/guards/
  ├── jwt-auth.guard.ts (vérifier si existe)
  └── roles.guard.ts

# Nouveaux guards à créer
src/common/guards/
  ├── is-current-user.guard.ts (strict userId validation)
  ├── is-current-user-or-admin.guard.ts (hybrid auth)
  └── validate-path-user-id.guard.ts (optional, for controller-level)
```

### **2. Decorators à créer**

```bash
src/common/decorators/
  ├── current-user.decorator.ts (extract JWT user)
  ├── roles.decorator.ts (specify required roles)
  ├── is-current-user.decorator.ts (self-only)
  └── is-current-user-or-admin.decorator.ts (self + admin)
```

### **3. Types à définir**

```typescript
// src/common/types/auth.types.ts
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}
```

---

## 🎯 Ordre d'implémentation recommandé

### **Étape 1: Infrastructure Guards & Decorators** (BLOCKERS)

```bash
1. Vérifier @volontariapp/auth exports
   rtk grep -r "export.*Guard" node_modules/@volontariapp/auth

2. Créer custom guards dans src/common/guards/
   - JwtAuthGuard (si pas existant)
   - RolesGuard
   - IsCurrentUserOrAdminGuard

3. Créer decorators dans src/common/decorators/
   - @Roles()
   - @CurrentUser()
   - @IsCurrentUserOrAdmin()
```

### **Étape 2: Controllers - Ordre de complexité croissante**

**A. SocialUserController** (SIMPLEST - 3 routes, all ADMIN)

```bash
Changes needed: Add @Roles(Role.ADMIN) to 3 methods
Complexity: 15 mins
Testing: 20 mins
```

**B. InteractionController** (SIMPLE - 3 routes, strict validation)

```bash
Changes needed: Add @IsCurrentUser() + parameter validation
Complexity: 20 mins
Testing: 25 mins
```

**C. PublicationController** (MEDIUM - 4 routes, mixed guards)

```bash
Changes needed: 2 routes ADMIN, 2 routes IsCurrentUserOrAdmin
Complexity: 25 mins
Testing: 30 mins
```

**D. ParticipationController** (COMPLEX - 9 routes, multiple DTOs)

```bash
Changes needed: 2 routes ADMIN, 7 routes IsCurrentUserOrAdmin
Complexity: 45 mins
Testing: 45 mins
```

**E. RelationshipController** (MOST COMPLEX - 8 routes, controller redesign)

```bash
Changes needed: Refactor controller path + add guards
Complexity: 60 mins (OPTION A) or 30 mins (OPTION B)
Testing: 60 mins
```

### **Étape 3: Testing & Validation** (ALL ENDPOINTS)

```bash
1. Unit tests for all guards with mock JWT
2. Integration tests for each endpoint
3. Cross-user access tests (should fail)
4. Admin bypass tests (should succeed)
5. Load test JWT extraction
```

### **Étape 4: Documentation & Migration**

```bash
1. Update API docs (Swagger/OpenAPI)
2. Create client migration guide
3. Update SDK docs
4. Announce deprecation timeline for old clients
```

---

## 🔍 Validation Checklist

### **Avant chaque commit:**

```bash
# Vérifier les routes impactées
rtk grep -r "@Param('userId')" src/modules/social

# Vérifier les guards appliqués
rtk grep -r "@Roles\|@IsCurrentUser\|@UseGuards" src/modules/social

# Vérifier les imports
rtk grep -r "common/decorators\|common/guards" src/modules/social

# Linter
npm run lint src/modules/social

# Tests unitaires
npm run test src/modules/social --watch
```

### **Avant de merger:**

```bash
# Tests intégration
npm run test:e2e social

# Type checking
npm run typecheck

# Build
npm run build

# Verify no regressions
npm run test
```

---

## 📊 Timeline Estimation

| Phase     | Tâche                   | Durée     |
| --------- | ----------------------- | --------- |
| 1         | Setup guards/decorators | 1-2h      |
| 2A        | SocialUserController    | 30m       |
| 2B        | InteractionController   | 45m       |
| 2C        | PublicationController   | 45m       |
| 2D        | ParticipationController | 1.5h      |
| 2E        | RelationshipController  | 1-2h      |
| 3         | Testing & validation    | 2-3h      |
| 4         | Documentation           | 1h        |
| **TOTAL** | **Full Migration**      | **7-10h** |

---

## 🚨 Common Pitfalls

### ❌ Pitfall 1: JWT userId extraction

```typescript
// WRONG
const userId = req.user; // undefined if guard doesn't inject

// RIGHT
const jwtPayload: JwtPayload = req.user || req['user'];
const userId = jwtPayload.userId;
```

### ❌ Pitfall 2: Guard ordering

```typescript
// WRONG - checks roles before JWT validation
@UseGuards(RolesGuard, JwtAuthGuard)

// RIGHT - validate JWT first
@UseGuards(JwtAuthGuard, RolesGuard)
```

### ❌ Pitfall 3: Path param validation

```typescript
// WRONG - doesn't validate path vs JWT
if (JWT_ROLE === ADMIN) allow();

// RIGHT - validates both
if (pathUserId === jwtUserId || jwtRole === ADMIN) allow();
else throw 403;
```

### ❌ Pitfall 4: RelationshipController routing

```typescript
// WRONG - all routes fail if controller path has :userId
@Controller('social/users/:userId')
@Get('follows') // Resolved to /social/users/:userId/follows
follows(@Param('userId') userId) { ... }

// RIGHT - either change controller path or move userId to routes
@Controller('social/users')
@Get(':userId/follows')
follows(@Param('userId') userId) { ... }
```

---

## 🎬 Quick Start

```bash
# 1. Create branches for each phase
git checkout -b feat/auth-infrastructure
git checkout -b feat/auth-social-controllers

# 2. Start with infrastructure
# Create src/common/guards/roles.guard.ts
# Create src/common/decorators/roles.decorator.ts
# Create src/common/types/auth.types.ts

# 3. Test guards work
npm run test src/common/guards

# 4. Apply to controllers incrementally
# Start with SocialUserController (easiest)

# 5. Verify with RTK
rtk gain  # See token savings from well-typed code
```
