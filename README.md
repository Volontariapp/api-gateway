# API Gateway - Volontariapp

## Project Overview & Value Proposition

L'**API Gateway** de Volontariapp agit comme le point d'entrée central sécurisé (Single Point of Entry) pour les clients front-end. Bien que conçu pour être agnostique, son périmètre actuel est de servir de **Backend For Frontend (BFF)** privé, principalement pour l'application mobile React Native (`nativapp`).
Il agrège, orchestre et expose les fonctionnalités métier sous-jacentes en s'interfaçant avec un écosystème de microservices via un protocole binaire hautement performant (gRPC).

## Key Features

- **Routage et Orchestration** : Aiguillage des requêtes HTTP/REST entrantes vers les microservices appropriés (User, Event, Post, Social).
- **Authentification et Autorisation** : Validation des JWT (`AccessTokenGuard`) et contrôle d'accès basé sur les rôles (`RolesGuard`) de manière centralisée.
- **Validation des Requêtes** : Sanitisation et validation stricte des payloads via DTOs et `class-validator`.
- **Documentation Interactive** : Auto-génération de spécifications OpenAPI/Swagger granulaires par domaine.
- **Proxy WebSockets** : Relais des connexions persistantes vers le composant `ws-service` pour les retours asynchrones (feedback loop).

## Tech Stack & Dependencies

| Composant                   | Technologie                   | Description                                                             |
| :-------------------------- | :---------------------------- | :---------------------------------------------------------------------- |
| **Framework Base**          | NestJS (Node.js)              | Architecture modulaire, Inversion de Contrôle (IoC).                    |
| **Communication (Interne)** | gRPC & Protocol Buffers       | Échanges binaires bas latence avec les microservices (`@grpc/grpc-js`). |
| **Validation & Mapping**    | class-validator / transformer | Intégrité des données entrantes.                                        |
| **Documentation API**       | Swagger / Scalar OpenAPI      | Contrats d'interface HTTP.                                              |
| **Tests**                   | Jest / Supertest              | Tests unitaires (TDD) et d'intégration (E2E).                           |

## Getting Started

### Prérequis

- **Node.js** : >= 24.14.0
- **Package Manager** : Yarn v4 (`corepack enable`)
- **Docker** : Pour l'exécution locale des dépendances.

### Installation

```bash
# Depuis la racine du monorepo meta
cd api-gateway

# Installation des dépendances
yarn install
```

### Configuration (.env)

Assurez-vous que la configuration réseau et les variables d'environnement sont correctement définies via le système de configuration centralisé.
En local, cela passe par l'infrastructure déclarée dans les dossiers `config/`.

### Exécution (Local)

```bash
# Lancement en mode développement avec Hot-Reload
yarn start:local
# ou
yarn start:dev
```

L'API HTTP sera disponible sur le port configuré (par défaut: 3000) et la documentation interactive sur `/docs`.

## Documentation Technique Détaillée

Pour une compréhension approfondie des choix techniques, de la structure interne et de la stratégie de test, veuillez consulter les documents dédiés dans le dossier `docs/` :

- 🏛️ **[Architecture détaillée & Flux gRPC](docs/ARCHITECTURE.md)**
- 🧪 **[Stratégie de Test & Assurance Qualité](docs/TESTS.md)**

## Testing (Aperçu)

```bash
# Exécution des tests d'intégration E2E
yarn test:e2e
```

## CI/CD & Deployment

L'API Gateway est packagé sous forme de conteneur OCI (Docker).

- **Intégration Continue (CI)** : Gérée via **GitHub Actions** (Linting, Tests unitaires, Build de l'image Docker, analyses Gitleaks).
- **Déploiement Continu (CD)** : L'infrastructure repose sur une approche **GitOps** poussée via **ArgoCD**. L'API Gateway est déployé sur un cluster **Kubernetes (K3s)** durci (normes PSA Restricted, Sealed Secrets, et Network Policies en Default-Deny).
