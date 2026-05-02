# 📍 Résumé Complet: 27 Routes avec userId Path Parameter

## 🎯 Vue d'ensemble rapide

```
┌─────────────────────────────────────────────────────────────────┐
│  MIGRATION: userId PATH PARAM → JWT + ROLE ADMIN                │
├─────────────────────────────────────────────────────────────────┤
│  Total Routes: 27                                               │
│  Controllers: 5 (all in SOCIAL module)                         │
│  Event Module: 0 routes affected ✅                            │
│  Complexity: HIGH (RelationshipController needs redesign)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Tableau consolidé: Toutes les 27 routes

| #                                                          | Contrôleur    | HTTP   | Route Path                                          | Param              | Guard Requis              | Complexité | Urgence     |
| ---------------------------------------------------------- | ------------- | ------ | --------------------------------------------------- | ------------------ | ------------------------- | ---------- | ----------- |
| **A. SocialUserController** (`/social/users`)              |               |        |                                                     |                    |                           |            |             |
| 1                                                          | SocialUser    | POST   | `/social/users/:userId`                             | userId             | `@Roles(ADMIN)`           | 🟢 Trivial | 🔴 CRITICAL |
| 2                                                          | SocialUser    | GET    | `/social/users/:userId`                             | userId             | `@Roles(ADMIN)`           | 🟢 Trivial | 🔴 CRITICAL |
| 3                                                          | SocialUser    | DELETE | `/social/users/:userId`                             | userId             | `@Roles(ADMIN)`           | 🟢 Trivial | 🔴 CRITICAL |
| **B. PublicationController** (`/social`)                   |               |        |                                                     |                    |                           |            |             |
| 4                                                          | Publication   | POST   | `/social/users/:userId/posts/:postId/own`           | userId, postId     | `@Roles(ADMIN)`           | 🟢 Simple  | 🟡 HIGH     |
| 5                                                          | Publication   | DELETE | `/social/users/:userId/posts/:postId/own`           | userId, postId     | `@Roles(ADMIN)`           | 🟢 Simple  | 🟡 HIGH     |
| 6                                                          | Publication   | GET    | `/social/users/:userId/posts`                       | userId             | `@IsCurrentUserOrAdmin()` | 🟡 Medium  | 🟡 HIGH     |
| 7                                                          | Publication   | GET    | `/social/users/:userId/feed`                        | userId             | `@IsCurrentUserOrAdmin()` | 🟡 Medium  | 🟡 HIGH     |
| **C. RelationshipController** (`/social/users/:userId`) ⚠️ |               |        |                                                     |                    |                           |            |             |
| 8                                                          | Relationship  | POST   | `/social/users/:userId/follow/:followedId`          | userId, followedId | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 9                                                          | Relationship  | DELETE | `/social/users/:userId/follow/:followedId`          | userId, followedId | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 10                                                         | Relationship  | POST   | `/social/users/:userId/block/:blockedId`            | userId, blockedId  | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 11                                                         | Relationship  | DELETE | `/social/users/:userId/block/:blockedId`            | userId, blockedId  | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 12                                                         | Relationship  | GET    | `/social/users/:userId/follows`                     | userId             | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 13                                                         | Relationship  | GET    | `/social/users/:userId/followers`                   | userId             | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 14                                                         | Relationship  | GET    | `/social/users/:userId/blocks`                      | userId             | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 15                                                         | Relationship  | GET    | `/social/users/:userId/who-blocked-me`              | userId             | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| **D. ParticipationController** (`/social`)                 |               |        |                                                     |                    |                           |            |             |
| 16                                                         | Participation | POST   | `/social/users/:userId/events/:eventId/own`         | userId, eventId    | `@Roles(ADMIN)`           | 🟠 Complex | 🔴 CRITICAL |
| 17                                                         | Participation | DELETE | `/social/users/:userId/events/:eventId/own`         | userId, eventId    | `@Roles(ADMIN)`           | 🟠 Complex | 🔴 CRITICAL |
| 18                                                         | Participation | POST   | `/social/users/:userId/events/:eventId/participate` | userId, eventId    | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 19                                                         | Participation | DELETE | `/social/users/:userId/events/:eventId/participate` | userId, eventId    | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 20                                                         | Participation | GET    | `/social/users/:userId/events/created`              | userId             | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 21                                                         | Participation | GET    | `/social/users/:userId/events/participated`         | userId             | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 22                                                         | Participation | POST   | `/social/users/:userId/events/:eventId/wish`        | userId, eventId    | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 23                                                         | Participation | DELETE | `/social/users/:userId/events/:eventId/wish`        | userId, eventId    | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| 24                                                         | Participation | GET    | `/social/users/:userId/events/wished`               | userId             | `@IsCurrentUserOrAdmin()` | 🟠 Complex | 🔴 CRITICAL |
| **E. InteractionController** (`/social`)                   |               |        |                                                     |                    |                           |            |             |
| 25                                                         | Interaction   | POST   | `/social/users/:userId/likes/:postId`               | userId, postId     | `@IsCurrentUser()` ⚠️     | 🟡 Medium  | 🟡 HIGH     |
| 26                                                         | Interaction   | DELETE | `/social/users/:userId/likes/:postId`               | userId, postId     | `@IsCurrentUser()` ⚠️     | 🟡 Medium  | 🟡 HIGH     |
| 27                                                         | Interaction   | GET    | `/social/users/:userId/likes`                       | userId             | `@IsCurrentUserOrAdmin()` | 🟡 Medium  | 🟡 HIGH     |

---

## 🏆 Groupe par Stratégie d'Auth

### **Groupe 1: ADMIN Only (Strictest)** 🔐

Routes: 1, 2, 3, 4, 5, 16, 17

```typescript
@Roles(Role.ADMIN)
```

**Logique:**

- Only admin users can execute
- No parameters validation needed
- Simple implementation
- High security

**Routes affectées:**

- SocialUserController: 3 routes
- PublicationController: 2 routes
- ParticipationController: 2 routes

---

### **Groupe 2: Hybrid Auth (Self + Admin)** ⚙️

Routes: 6, 7, 12, 13, 14, 15, 20, 21, 24, 27

```typescript
@UseGuards(JwtAuthGuard)
@IsCurrentUserOrAdmin()
```

**Logique:**

- User can access own data
- Admin can access any user's data
- Parameter validation: `pathUserId === jwtUserId || isAdmin`
- Medium complexity

**Routes affectées:**

- PublicationController: 2 routes
- RelationshipController: 4 routes
- ParticipationController: 4 routes
- InteractionController: 1 route

---

### **Groupe 3: Strict Self-Only** 👤

Routes: 25, 26

```typescript
@UseGuards(JwtAuthGuard)
@IsCurrentUser()
```

**Logique:**

- ONLY the user themselves can act
- NO admin bypass (fraud prevention)
- Strict parameter validation
- Low complexity but high validation

**Routes affectées:**

- InteractionController: 2 routes

---

### **Groupe 4: Hybrid with Mutation (Self + Admin)** 🔄

Routes: 8, 9, 10, 11, 18, 19, 22, 23

```typescript
@UseGuards(JwtAuthGuard)
@IsCurrentUserOrAdmin()
```

**Logique:**

- Mutations (POST/DELETE)
- User acts on self OR admin acts on any
- Same validation as Groupe 2
- Controller-level redesign needed (RelationshipController)

**Routes affectées:**

- RelationshipController: 4 routes (requires controller redesign)
- ParticipationController: 4 routes

---

## 📈 Distribution par Complexité

```
Trivial (🟢):     3 routes (11%)  → 30 min
Simple (🟡):      4 routes (15%)  → 1h
Medium (🟡):      10 routes (37%) → 2h
Complex (🟠):     10 routes (37%) → 3h
─────────────────────────────────
TOTAL:            27 routes       → 6-7h
```

---

## 🎯 Groupement par Contrôleur

### **1. SocialUserController** (Admin only - SIMPLEST)

- Lines to change: ~15
- Time estimate: 15-20 minutes
- Risk: LOW ✅

### **2. InteractionController** (Strict validation)

- Lines to change: ~30
- Time estimate: 30-40 minutes
- Risk: LOW (simple logic)
- ⚠️ Special: No admin bypass on mutations

### **3. PublicationController** (Mixed guards)

- Lines to change: ~40
- Time estimate: 45-60 minutes
- Risk: MEDIUM (4 different routes)

### **4. ParticipationController** (Multiple DTOs)

- Lines to change: ~60
- Time estimate: 1-1.5 hours
- Risk: MEDIUM (9 routes across 2 patterns)
- Important: Consistent guard application

### **5. RelationshipController** (MOST COMPLEX)

- Lines to change: ~50-100
- Time estimate: 1-2 hours
- Risk: HIGH ⚠️
- Reason: Controller-level path param requires redesign

---

## 🔧 Infrastructure à Créer

### **Guards** (4 fichiers)

```
src/common/guards/
├── jwt-auth.guard.ts                    (~50 lines, if not exists)
├── roles.guard.ts                       (~40 lines)
├── is-current-user-or-admin.guard.ts   (~60 lines) ← NEW
└── is-current-user.guard.ts            (~50 lines) ← NEW
```

### **Decorators** (4 fichiers)

```
src/common/decorators/
├── current-user.decorator.ts            (~20 lines)
├── roles.decorator.ts                   (~15 lines)
├── is-current-user.decorator.ts        (~25 lines) ← NEW
└── is-current-user-or-admin.decorator.ts (~30 lines) ← NEW
```

### **Types** (1 fichier)

```
src/common/types/
└── auth.types.ts                        (~40 lines) ← NEW

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
```

---

## 🧪 Testing Matrix

| Route Type | Test Case       | Priority              |
| ---------- | --------------- | --------------------- |
| ADMIN Only | Admin access ✅ | P0                    |
| ADMIN Only | User access ❌  | P0                    |
| Hybrid     | Self access ✅  | P0                    |
| Hybrid     | Admin access ✅ | P0                    |
| Hybrid     | Other user ❌   | P0                    |
| Self-Only  | Self access ✅  | P0                    |
| Self-Only  | Admin access ❌ | P1 (fraud prevention) |
| Self-Only  | Other user ❌   | P0                    |

---

## 🚀 Commandes RTK Essentielles

```bash
# Voir les économies de tokens
rtk gain

# Trouver toutes les routes userId
rtk grep -r "userId" src/modules/social/controllers | wc -l
# Output: 27

# Vérifier les guards appliqués
rtk grep -r "@Roles\|@UseGuards\|@IsCurrentUser" src/modules/social

# Lister les fichiers guards
rtk ls -la src/common/guards/

# Voir les imports d'auth
rtk grep -r "from.*auth" src/modules/
```

---

## 📋 Détail des changements par fichier

### **Fichiers à MODIFIER:**

- src/modules/social/controllers/social-user.controller.ts (3 méthodes)
- src/modules/social/controllers/publication.controller.ts (4 méthodes)
- src/modules/social/controllers/relationship.controller.ts (8 méthodes + controller path)
- src/modules/social/controllers/participation.controller.ts (9 méthodes)
- src/modules/social/controllers/interaction.controller.ts (3 méthodes)

### **Fichiers à CRÉER:**

- src/common/guards/roles.guard.ts
- src/common/guards/is-current-user-or-admin.guard.ts
- src/common/guards/is-current-user.guard.ts
- src/common/decorators/roles.decorator.ts
- src/common/decorators/is-current-user.decorator.ts
- src/common/decorators/is-current-user-or-admin.decorator.ts
- src/common/types/auth.types.ts

### **Fichiers à VÉRIFIER:**

- src/common/guards/jwt-auth.guard.ts (existe? contenu valide?)
- src/common/decorators/current-user.decorator.ts (existe? contenu valide?)
- src/app.module.ts (AuthModule configuration)

---

## ⏱️ Timeline Réaliste

```
Phase 1: Infrastructure         → 1-2h (Guards + Decorators)
Phase 2A: SocialUserController → 20m
Phase 2B: InteractionController → 40m
Phase 2C: PublicationController → 50m
Phase 2D: ParticipationController → 1h 15m
Phase 2E: RelationshipController → 1h 30m (most complex)
Phase 3: Testing & Validation   → 2-3h
Phase 4: Documentation          → 1h
─────────────────────────────────────────
TOTAL ESTIMATE:                 → 8-10 heures

Optimized approach (parallel):
- Person A: Infrastructure (Phase 1)
- Person B: SocialUser + Interaction (Phase 2A-B)
- Person A: Publication + Participation (Phase 2C-D)
- Both: RelationshipController (Phase 2E)
- Both: Testing (Phase 3)
─────────────────────────────────────────
OPTIMIZED TIMELINE:              → 5-6 heures
```

---

## ✅ Checklist Final

- [ ] All 27 routes identified ✅
- [ ] Guards designed & planned
- [ ] Decorators designed & planned
- [ ] Types defined
- [ ] Complexity assessment done ✅
- [ ] Order of implementation defined ✅
- [ ] Testing strategy defined ✅
- [ ] Infrastructure files created
- [ ] Controllers updated
- [ ] Tests written
- [ ] Integration tests passed
- [ ] Documentation updated
- [ ] API clients notified
- [ ] Rollback plan ready
- [ ] Monitoring configured
