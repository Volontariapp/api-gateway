# 📋 Rapport d'Impact: Migration userId Path Param → JWT + Role ADMIN

**Date:** 2026-05-02  
**Scope:** Modules Social & Event  
**Status:** ANALYSIS

---

## 📊 Executive Summary

Migration de **27 endpoints** qui utilisent `userId` en path parameter vers une approche basée sur JWT token + role ADMIN. Les routes seront conservées mais protégées pour garantir que seul un administrateur peut accéder aux ressources d'autres utilisateurs.

**Impact Total:**

- ✅ **27 endpoints** à modifier (validation + ajout guard ADMIN)
- ✅ **5 contrôleurs** impactés dans le module Social
- ✅ **0 contrôleurs** impactés dans le module Event
- 🔍 **0 services** gRPC à modifier (backward compatible)
- ⚠️ **Clients/SDK** doivent être mis à jour pour envoyer le token JWT

---

## 🎯 Routes Impactées par Contrôleur

### **SOCIAL MODULE**

#### 1️⃣ **SocialUserController** (`social/users`)

**Status:** ⚠️ CRITICAL - Base path contains userId  
**Callers:** Internal admin operations

| #   | Endpoint         | Method | Path                    | Current Auth |
| --- | ---------------- | ------ | ----------------------- | ------------ |
| 1   | Create user node | POST   | `/social/users/:userId` | ❌ None      |
| 2   | Get user node    | GET    | `/social/users/:userId` | ❌ None      |
| 3   | Delete user node | DELETE | `/social/users/:userId` | ❌ None      |

**Action Required:**

- ✅ Add `@Roles(Role.ADMIN)` guard
- ✅ Extract userId from JWT (validate path param matches token if present)
- ✅ Log admin access for audit trail

---

#### 2️⃣ **PublicationController** (`social`)

**Status:** 🟡 HIGH - 4 endpoints with userId  
**Callers:** User ownership operations

| #   | Endpoint                | Method | Path                                      | Current Auth |
| --- | ----------------------- | ------ | ----------------------------------------- | ------------ |
| 4   | Link user as post owner | POST   | `/social/users/:userId/posts/:postId/own` | ❌ None      |
| 5   | Unlink user from post   | DELETE | `/social/users/:userId/posts/:postId/own` | ❌ None      |
| 6   | Get user posts          | GET    | `/social/users/:userId/posts`             | ❌ None      |
| 7   | Get user feed           | GET    | `/social/users/:userId/feed`              | ❌ None      |

**Action Required:**

- ✅ Routes 4-5: Add ADMIN role (ownership management)
- ✅ Routes 6-7: Add auth guard + validate userId matches JWT (allow self-read OR admin)
- ✅ Add query param `?userId=` as future migration path

---

#### 3️⃣ **RelationshipController** (`social/users/:userId`)

**Status:** 🔴 CRITICAL - Controller-level path parameter  
**Callers:** High frequency (follows, blocks, relationships)

| #   | Endpoint           | Method | Path                                       | Current Auth |
| --- | ------------------ | ------ | ------------------------------------------ | ------------ |
| 8   | Follow user        | POST   | `/social/users/:userId/follow/:followedId` | ❌ None      |
| 9   | Unfollow user      | DELETE | `/social/users/:userId/follow/:followedId` | ❌ None      |
| 10  | Block user         | POST   | `/social/users/:userId/block/:blockedId`   | ❌ None      |
| 11  | Unblock user       | DELETE | `/social/users/:userId/block/:blockedId`   | ❌ None      |
| 12  | Get user follows   | GET    | `/social/users/:userId/follows`            | ❌ None      |
| 13  | Get user followers | GET    | `/social/users/:userId/followers`          | ❌ None      |
| 14  | Get user blocks    | GET    | `/social/users/:userId/blocks`             | ❌ None      |
| 15  | Get who blocked me | GET    | `/social/users/:userId/who-blocked-me`     | ❌ None      |

**Action Required:**

- ⚠️ **Most complex:** Controller decorator has `:userId` → needs redesign
- ✅ Option A: Move userId to query param for READ endpoints
- ✅ Option B: Keep path param + add ADMIN-only access
- ✅ Option C: Hybrid - self/admin access for sensitive operations

**Recommendation:** Hybrid approach (Option C)

- Write ops (follow/block): JWT userId must match path param OR admin role
- Read ops (follows/blocks): Allow self-read + admin read, others = 403

---

#### 4️⃣ **ParticipationController** (`social`)

**Status:** 🔴 CRITICAL - 9 endpoints with userId  
**Callers:** Event participation lifecycle

| #   | Endpoint                     | Method | Path                                                | Current Auth |
| --- | ---------------------------- | ------ | --------------------------------------------------- | ------------ |
| 16  | Link user as event creator   | POST   | `/social/users/:userId/events/:eventId/own`         | ❌ None      |
| 17  | Unlink user from event       | DELETE | `/social/users/:userId/events/:eventId/own`         | ❌ None      |
| 18  | User participates            | POST   | `/social/users/:userId/events/:eventId/participate` | ❌ None      |
| 19  | User stops participating     | DELETE | `/social/users/:userId/events/:eventId/participate` | ❌ None      |
| 20  | Get user created events      | GET    | `/social/users/:userId/events/created`              | ❌ None      |
| 21  | Get user participated events | GET    | `/social/users/:userId/events/participated`         | ❌ None      |
| 22  | Add to user wishes           | POST   | `/social/users/:userId/events/:eventId/wish`        | ❌ None      |
| 23  | Remove from wishes           | DELETE | `/social/users/:userId/events/:eventId/wish`        | ❌ None      |
| 24  | Get user wished events       | GET    | `/social/users/:userId/events/wished`               | ❌ None      |

**Action Required:**

- ✅ Routes 16-19: ADMIN-only or owner+admin
- ✅ Routes 20-24: Self-read + admin read (hybrid auth)
- ✅ Add `X-User-ID` header validation to match JWT

---

#### 5️⃣ **InteractionController** (`social`)

**Status:** 🟡 HIGH - 3 endpoints with userId  
**Callers:** User engagement (likes)

| #   | Endpoint       | Method | Path                                  | Current Auth |
| --- | -------------- | ------ | ------------------------------------- | ------------ |
| 25  | Like post      | POST   | `/social/users/:userId/likes/:postId` | ❌ None      |
| 26  | Unlike post    | DELETE | `/social/users/:userId/likes/:postId` | ❌ None      |
| 27  | Get user likes | GET    | `/social/users/:userId/likes`         | ❌ None      |

**Action Required:**

- ✅ Routes 25-26: JWT userId MUST match path param (no cross-user likes)
- ✅ Route 27: Self-read + admin read
- ✅ Add guard to prevent userId mismatch

---

### **EVENT MODULE**

| Status           | Finding                                                    |
| ---------------- | ---------------------------------------------------------- |
| ✅ **No Impact** | EventController has no userId in path params               |
|                  | Routes are event-centric (`/events/:id`), not user-centric |

---

## 🔐 Implementation Strategy

### **Phase 1: Infrastructure** (Pre-requisite)

```
1. Create @IsCurrentUser() decorator
   - Extract userId from JWT token
   - Compare with path param
   - Throw 403 if mismatch

2. Create @Roles(Role.ADMIN) guard (if not exists)
   - Check JWT payload for role
   - Enforce at method level

3. Update current auth infrastructure
   - Verify @volontariapp/auth exports required guards
   - Add custom decorators to src/common/decorators/
```

### **Phase 2: Implementation** (Modules → Controllers)

**Step 1: SocialUserController**

- Add `@Roles(Role.ADMIN)` to all 3 endpoints
- Rationale: Internal admin-only operations

**Step 2: PublicationController**

- Routes 4-5 (own/disown): `@Roles(Role.ADMIN)`
- Routes 6-7 (feed/posts): `@IsCurrentUserOrAdmin()` guard
- Rationale: Data access control

**Step 3: RelationshipController** ⚠️ **HIGHEST COMPLEXITY**

- Redesign controller routing to accept userId in body/query
- OR: Add guard that validates JWT userId matches path
- Routes 8-11: `@IsCurrentUserOrAdmin()` for mutation
- Routes 12-15: `@IsCurrentUserOrAdmin()` for read
- Recommendation: Implement custom guard with hybrid logic

**Step 4: ParticipationController**

- Routes 16-19: `@Roles(Role.ADMIN)` + creator validation
- Routes 20-24: `@IsCurrentUserOrAdmin()`
- Most complex: 9 endpoints across 2 DTOs

**Step 5: InteractionController**

- Routes 25-26: Strict `@IsCurrentUser()` (must match JWT)
- Route 27: `@IsCurrentUserOrAdmin()`
- Simplest: Pure self-service model

### **Phase 3: Testing**

- Update integration tests to include JWT token with userId
- Test admin role can access any userId
- Test regular user gets 403 on others' data
- Test JWT mismatch scenarios

### **Phase 4: Migration**

- Update API clients to extract userId from JWT
- Keep backward compatibility with admin access
- Deprecate path param usage in favor of JWT extraction

---

## 📈 Risk Assessment

| Risk                                  | Level     | Mitigation                                     |
| ------------------------------------- | --------- | ---------------------------------------------- |
| **Breaking Change**                   | 🔴 HIGH   | Clients must send valid JWT with userId claim  |
| **Cross-User Data Access**            | 🔴 HIGH   | Implement strict role + parameter validation   |
| **RelationshipController Complexity** | 🟡 MEDIUM | Requires controller redesign or hybrid guard   |
| **Audit Trail Loss**                  | 🟡 MEDIUM | Log all admin access (who accessed whose data) |
| **Performance**                       | 🟢 LOW    | JWT parsing is O(1), no DB overhead            |

---

## 📝 Procedure Checklist

### ✅ Pre-Implementation

- [ ] Review @volontariapp/auth module exports
- [ ] Confirm JWT structure (userId claim location)
- [ ] Define Role enum if not exists
- [ ] Design hybrid auth logic for RelationshipController
- [ ] Create empty test files for all 5 controllers

### ✅ Implementation

- [ ] Create decorators: `@IsCurrentUser()`, `@IsCurrentUserOrAdmin()`
- [ ] Create role guard: `RolesGuard`
- [ ] Update SocialUserController (3 endpoints)
- [ ] Update PublicationController (4 endpoints)
- [ ] Update RelationshipController (8 endpoints) ⚠️
- [ ] Update ParticipationController (9 endpoints)
- [ ] Update InteractionController (3 endpoints)
- [ ] Add @ApiUnauthorizedResponse to Swagger docs

### ✅ Testing

- [ ] Unit test all guards with mock JWT
- [ ] Integration test each endpoint with valid/invalid tokens
- [ ] Test admin bypass works on all endpoints
- [ ] Test user cannot access other users' data
- [ ] Load test JWT extraction (performance check)

### ✅ Deployment

- [ ] Create migration guide for API clients
- [ ] Update SDK/client docs with new JWT requirement
- [ ] Add monitoring for 403 errors (auth failures)
- [ ] Prepare rollback plan (feature flag for old behavior)

---

## 🚀 RTK Commands for This Migration

```bash
# Analyze code dependencies
rtk grep -r "@Param('userId')" src/

# Find all controller methods using userId
rtk grep -r "Param('userId')" src/modules/social/ | wc -l

# Check guard/decorator files
rtk ls src/common/guards/
rtk ls src/common/decorators/

# Search for existing role definitions
rtk grep -r "Role.ADMIN" src/

# Find AuthModule imports
rtk grep -r "AuthModule" src/

# View token savings
rtk gain
```

---

## 📌 Notes

1. **RelationshipController** is the most complex due to controller-level path param

   - Requires either: routing redesign OR hybrid guard logic
   - Recommend implementing custom guard with context injection

2. **Event Module** remains unaffected - all routes are resource-based, not user-based

3. **Backward Compatibility** can be maintained with:

   - Feature flag to allow anonymous access (during transition)
   - Admin role bypasses all validation
   - Gradual client migration window (e.g., 30 days)

4. **Future Improvements:**
   - Move userId to JWT claim extraction (remove from path entirely)
   - Use query params for advanced filtering
   - Implement GraphQL subscription for real-time feeds

---

## 📚 References

- Auth Module: `@volontariapp/auth`
- Contracts: `@volontariapp/contracts-nest`
- Error Module: `@volontariapp/errors-nest`
- Logger: `@volontariapp/logger`
