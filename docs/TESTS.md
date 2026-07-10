# Tests & Quality Assurance (API Gateway)

## Vue d'ensemble de la Stratégie de Test

La stratégie de test pour l'API Gateway repose fortement sur des tests **End-to-End (E2E)** et d'**Intégration** pour s'assurer que les flux complets (HTTP entrant -> Validation -> appel gRPC -> Réponse) fonctionnent comme attendu.
En raison de sa nature (BFF et orchestration), l'API Gateway ne contient pas de logique métier pure. Les tests E2E sont donc le meilleur moyen de valider le contrat d'interface exposé aux clients, la bonne application des validateurs (DTOs) et le fonctionnement correct des Guards d'authentification (`AccessTokenGuard`, `RolesGuard`).

## Structure des Tests E2E

Le dossier `e2e/` est structuré logiquement par domaine fonctionnel :

```text
api-gateway/e2e/
├── event/          # Tests du cycle de vie des événements (création, cycle de vie)
├── helpers/        # Utilitaires de test, configuration de l'app in-memory
├── post/           # Tests liés aux flux d'actualités
├── social/         # Tests sur les graphes et relations sociales
└── user/           # Tests sur l'authentification et les profils
```

Chaque suite de test utilise un pattern strict d'isolation :

- **Fichiers de test** (`*.e2e.spec.ts`) : Contiennent les assertions (exécutées via `Supertest` et `Jest`).
- **Factories** (`*.factory.ts`) : Utilisent Faker ou des stubs codés en dur pour générer systématiquement les payloads attendus (ex: `buildUserDto()`).

## Exécution

Le point d'entrée pour la configuration Jest se situe dans `test/jest-e2e.json`.

```bash
# Lancer l'intégralité des tests E2E
yarn test:e2e

# Lancer un fichier de test spécifique
yarn test:e2e event/event-lifecycle.e2e.spec.ts
```

## Standards d'Implémentation (Checklist QA)

Lors de l'ajout d'une nouvelle route (Endpoint) sur l'API Gateway, les standards suivants s'appliquent :

1. **Couverture Positif / Négatif** : Chaque endpoint doit valider le _Happy Path_ (HTTP `200`/`201`) ET les erreurs courantes (validation `400 Bad Request`, sécurité `401 Unauthorized`).
2. **Isolation des État** : L'environnement Node.js/NestJS de test est réinitialisé ou nettoyé pour empêcher la pollution de l'état entre les blocs `describe()`.
3. **Mocking gRPC** : Les clients microservices doivent être stubs pour éviter toute dépendance réseau réelle vers les autres briques applicatives, assurant la rapidité et la fiabilité de la suite E2E.
