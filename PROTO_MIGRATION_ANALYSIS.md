# 🔧 Proto Files Migration Analysis: userId Handling

## 🎯 Question Clé

**"Faut-il modifier les fichiers proto si userId est dans le JWT token?"**

**Réponse courte:** ✅ **OUI, probablement.** Mais avec une approche phased.

---

## 📊 État Actuel: Comment userId est géré

### **1. Message Proto (CURRENT)**

```typescript
// Exemple: PostUserOwnCommand
export interface PostUserOwnCommand {
  userId: string; // ← REQUIRED field in proto
  postId: string; // ← REQUIRED field in proto
}
```

### **2. Metadata (CURRENT)**

```typescript
// gateway controller
const metadata = req['internalMetadata'] as Metadata; // JWT token
return this.commandService.postUserOwn({ userId, postId }, metadata); // userId IN message + JWT in metadata
```

### **3. Backend Service (ASSUMED)**

```typescript
// social service receives:
// - Message: { userId: "abc", postId: "def" }
// - Metadata: JWT token with userId claim
```

---

## ❓ Le Problème Architectural

### **Duplication de userId**

```
CLIENT → API GATEWAY
  ├─ Path param: /users/:userId
  └─ JWT token: { userId: "abc" }
         ↓
    GATEWAY → gRPC SERVICE
    ├─ Message: { userId: "abc" }  ← DUPLICATE
    └─ Metadata: JWT token        ← CONTAINS userId AGAIN
         ↓
    SERVICE
    ├─ Reçoit userId 2 fois!
    └─ Quelle source de vérité? ⚠️
```

### **Après Migration (Desired)**

```
CLIENT → API GATEWAY
  └─ JWT token: { userId: "abc" }
         ↓
    GATEWAY → gRPC SERVICE
    ├─ Message: { postId: "def" }  ← NO userId (extracted from JWT)
    └─ Metadata: JWT token         ← CONTAINS userId
         ↓
    SERVICE
    ├─ Extrait userId from JWT metadata
    └─ Source de vérité unique = metadata
```

---

## 📋 Proto Files à Modifier

### **Scan: Quels messages contiennent userId?**

**COMMANDS avec userId (20+):**

```
✅ CreateSocialUserCommand          { userId }
✅ DeleteSocialUserCommand          { userId }
✅ PostUserOwnCommand               { userId, postId }
✅ DeleteUserOwnCommand             { userId, postId }
✅ PostLikePostCommand              { userId, postId }
✅ DeleteLikePostCommand            { userId, postId }
✅ PostUserEventCommand             { userId, eventId }
✅ DeleteUserEventCommand           { userId, eventId }
✅ PostUserParticipateEventCommand  { userId, eventId }
✅ DeleteUserParticipateEventCommand{ userId, eventId }
✅ PostUserWishEventCommand         { userId, eventId }
✅ DeleteUserWishEventCommand       { userId, eventId }

⚠️ PostFollowUserCommand            { followerId, followedId }  ← Already uses followerId!
⚠️ DeleteFollowUserCommand          { followerId, followedId }  ← Already uses followerId!
⚠️ PostBlockUserCommand             { blockerId, blockedId }    ← Already uses blockerId!
⚠️ DeleteBlockUserCommand           { blockerId, blockedId }    ← Already uses blockerId!
```

**QUERIES avec userId:**

```
✅ GetUserLikesQuery                { userId }
✅ GetUserPostsQuery                { userId }
✅ GetUserEventsQuery               { userId }
✅ GetMyFollowsQuery                { userId }
✅ GetMyFollowersQuery              { userId }
✅ GetMyBlocksQuery                 { userId }
✅ Etc...
```

---

## 🔄 Two-Approach Strategy

### **APPROACH A: Modify Proto (IDEAL) 🟢**

**Avantages:**

- ✅ Single source of truth (JWT metadata only)
- ✅ No duplication
- ✅ Backend service trusts JWT, not message
- ✅ Stronger security (can't forge userId in message)
- ✅ Cleaner architecture

**Désavantages:**

- ❌ Requires proto file updates (shared contracts)
- ❌ ALL microservices must update simultaneously
- ❌ Potential breaking change for other clients
- ❌ Coordination with backend teams needed

**Implementation:**

```typescript
// BEFORE (in proto)
message PostUserOwnCommand {
  string userId = 1;
  string postId = 2;
}

// AFTER (in proto)
message PostUserOwnCommand {
  string postId = 1;
  // userId removed - extract from JWT metadata instead
}

// Gateway level
const userId = extractUserIdFromJwt(metadata);
const command = { postId };  // userId NOT in message
// Backend extracts userId from context/metadata
```

---

### **APPROACH B: Keep Proto Unchanged (INTERIM) 🟡**

**Avantages:**

- ✅ No proto changes needed
- ✅ Can migrate gateway independently
- ✅ Backward compatible
- ✅ Easier rollout

**Désavantages:**

- ❌ Duplication of userId (message + metadata)
- ❌ Two sources of truth (confusing)
- ❌ Backend must validate userId consistency
- ❌ Security risk if message userId != JWT userId
- ⚠️ Need to detect & reject mismatches

**Implementation:**

```typescript
// Gateway: Keep passing userId in message
const metadata = extractJwt(req);
const command = { userId, postId };
this.commandService.postUserOwn(command, metadata);

// Backend must validate:
// if (command.userId !== extractUserIdFromJwt(metadata)) {
//   throw UnauthorizedException("userId mismatch");
// }
```

---

## 🏗️ Recommendation: PHASED APPROACH

### **Phase 1: Gateway-Only Migration (Week 1-2)** 🟡

**Status:** Quick win, maintain proto compatibility

```
1. Add JWT extraction to gateway controllers
2. Keep userId in proto messages (APPROACH B)
3. Add validation guards in gateway:
   - Extract userId from JWT
   - Validate matches path param
   - Pass BOTH to gRPC (for now)
4. Backend should log warnings if userId mismatch
```

**Benefits:**

- Deploy gateway changes without backend coordination
- Keep proto files stable
- Maintain backward compatibility

**Debt:**

- Duplication will exist temporarily
- Technical debt for future cleanup

---

### **Phase 2: Backend Proto Updates (Week 3-4)** 🟢

**Status:** Long-term cleanup, proper architecture

```
1. Coordinate with backend teams
2. Update proto files:
   - Remove userId from commands
   - Update queries to not require userId param
   - Add context-based userId extraction
3. Update all microservices:
   - Extract userId from JWT metadata
   - Validate JWT signature in backend
4. Remove userId from gateway message payload
```

**Benefits:**

- Proper single source of truth
- Stronger security model
- Cleaner architecture

**Requirements:**

- All backends must support JWT extraction
- GrpcInternalInterceptor must inject userId to context
- Coordinated rollout across services

---

## 📝 Decision Matrix

| Aspect          | Approach A (Modify)         | Approach B (Keep)      |
| --------------- | --------------------------- | ---------------------- |
| **Timeline**    | 3-4 weeks                   | 1-2 weeks              |
| **Effort**      | HIGH (proto + backends)     | LOW (gateway only)     |
| **Security**    | Better (single source)      | Current (dual sources) |
| **Complexity**  | HIGH (coordination)         | MEDIUM (validation)    |
| **Flexibility** | Better long-term            | Short-term workaround  |
| **Risk**        | MEDIUM (coordinated change) | LOW (isolated)         |

---

## 🎯 MY RECOMMENDATION: HYBRID

**Phase 1: Implement APPROACH B (Week 1)**

- Add JWT guards to gateway controllers
- Keep proto files unchanged
- Add runtime validation in gateway:

  ```typescript
  // Extract userId from JWT
  const jwtUserId = extractUserIdFromJwt(req['internalMetadata']);

  // Compare with path param (for security)
  if (jwtUserId !== pathUserId && !isAdmin(jwt)) {
    throw ForbiddenException('userId mismatch');
  }

  // Pass to gRPC (will be redundant until Phase 2)
  this.commandService.postUserOwn({ userId: pathUserId, postId }, metadata);
  ```

**Phase 2: Plan APPROACH A (Week 3-4)**

- Create tracking issue for proto updates
- Coordinate with backend teams
- Plan synchronized rollout
- Remove userId from commands gradually

---

## 🔍 Key Question: Does Backend Use userId from Message or Metadata?

**I NEED TO VERIFY:**

Before finalizing recommendation, check backend behavior:

```bash
# In social microservice:
# Does it extract userId from:
#   A) Message payload: command.userId
#   B) JWT metadata: extractFromContext()
#   C) BOTH and validate they match?
```

**If A:** Backend trusts message → Can keep proto as-is (simpler migration)
**If B:** Backend trusts metadata → Should remove from message (ideal)
**If C:** Backend validates both → APPROACH B with validation in gateway

---

## 📊 Impact on Each Controller

### **Controllers using REQUIRED userId in Proto:**

| Controller              | Commands                         | Status  | Proto Change?                 |
| ----------------------- | -------------------------------- | ------- | ----------------------------- |
| SocialUserController    | CreateUserNode, DeleteUserNode   | Easy    | ✅ Remove userId              |
| PublicationController   | PostUserOwn, DeleteUserOwn       | Medium  | ✅ Remove userId              |
| RelationshipController  | PostFollowUser, PostBlockUser    | Medium  | ⚠️ Already uses followerId!   |
| ParticipationController | PostUserEvent, PostUserWishEvent | Complex | ✅ Remove userId (9 commands) |
| InteractionController   | PostLikePost, DeleteLikePost     | Medium  | ✅ Remove userId              |

**Note:** RelationshipController already uses semantic names (followerId, blockerId) instead of userId. This is GOOD - suggests partial planning for this migration.

---

## 🚀 Action Items

### **THIS WEEK:**

- [ ] Verify how backend services currently use userId (message vs metadata)
- [ ] Check if @volontariapp/contracts-nest is shared across multiple services
- [ ] Understand coordination model with backend teams
- [ ] Check if GrpcInternalInterceptor already injects userId to context

### **NEXT WEEK:**

- [ ] Implement Phase 1 (gateway-only with validation)
- [ ] Add tests validating userId extraction from JWT
- [ ] Log mismatches between message userId and JWT userId
- [ ] Document technical debt

### **LATER:**

- [ ] Plan Phase 2 with backend teams
- [ ] Create proto update specs
- [ ] Coordinate synchronized rollout

---

## 💡 Summary

**Short Answer:** ✅ **Yes, proto files SHOULD be modified, but can WAIT until Phase 2.**

**Recommended Approach:**

1. **Week 1:** Add JWT guards in gateway (APPROACH B - keep proto unchanged)
2. **Week 3:** Plan proto updates with backend teams (APPROACH A - modify proto)
3. **Week 4:** Execute synchronized proto migration

**Key Insight:** RelationshipController already uses semantic names (followerId, blockerId) suggesting partial awareness of this pattern. Follow their lead and remove userId from proto messages long-term.
