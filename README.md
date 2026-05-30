# TicketFlow — SaaS Billetterie Événementielle

Plateforme SaaS de gestion d'événements et de billetterie, construite avec Clean Architecture, DDD et Node.js/TypeScript.

## Stack

- **Runtime** : Node.js 20 LTS + TypeScript strict
- **Framework** : Express.js
- **ORM** : Prisma + PostgreSQL
- **Cache/Queues** : Redis + BullMQ
- **Paiement** : Kkiapay (Mobile Money Afrique de l'Ouest)
- **Déploiement** : Docker + Railway/Render

---

## Démarrage rapide

### 1. Prérequis

- Node.js ≥ 20
- Docker & Docker Compose (pour le dev local)
- Compte Railway ou Render (pour le cloud)

### 2. Installation

```bash
git clone <repo>
cd ticketflow
cp .env.example .env
npm install
```

### 3. Démarrage local avec Docker

```bash
# Démarrer PostgreSQL + Redis
docker compose up db redis -d

# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate:dev

# Seeder la base avec des données de test
npm run db:seed

# Démarrer l'API en mode dev
npm run dev
```

L'API est accessible sur : http://localhost:3000

### 4. Démarrage complet avec Docker

```bash
docker compose up
```

---

## Déploiement Railway

### Variables d'environnement obligatoires

```
NODE_ENV=production
DATABASE_URL=<fourni par Railway PostgreSQL plugin>
REDIS_URL=<fourni par Railway Redis plugin>
JWT_SECRET=<générer avec: openssl rand -hex 32>
JWT_REFRESH_SECRET=<générer avec: openssl rand -hex 32>
APP_URL=https://votre-app.railway.app
TICKET_BASE_URL=https://votre-app.railway.app
```

### Commande de démarrage

Railway détecte automatiquement le Dockerfile. La commande `CMD` gère les migrations au démarrage.

---

## Déploiement Render

Créer un **Web Service** avec :

- **Build Command** : `npm ci && npx prisma generate && npm run build`
- **Start Command** : `npx prisma migrate deploy && node dist/index.js`
- **Environment** : Node

Ajouter les variables d'environnement dans le dashboard Render.

---

## Structure du projet

```
src/
├── domain/              # Logique métier pure — 0 dépendances externes
│   ├── entities/        # Ticket, Event, TicketCategory, ...
│   ├── value-objects/   # TicketToken, ...
│   ├── repositories/    # Interfaces (contrats)
│   ├── events/          # Domain Events (TicketPurchased, TicketScanned, ...)
│   └── services/        # Domain services
│
├── application/         # Use Cases — orchestre le domaine
│   ├── use-cases/
│   │   ├── ticket/      # CreateTicketPurchase, GenerateTicket, SendTicket...
│   │   ├── event/       # CreateEvent, UpdateTheme, GetDashboard...
│   │   ├── payment/     # ValidatePayment, HandleWebhook...
│   │   └── checkin/     # ValidateCheckin
│   ├── ports/           # Interfaces des services externes
│   └── dtos/            # Data Transfer Objects
│
├── infrastructure/      # Implémentations concrètes
│   ├── database/
│   │   ├── prisma/      # Client Prisma
│   │   └── repositories/# PrismaTicketRepository, PrismaEventRepository...
│   ├── providers/
│   │   ├── payment/     # KkiapayPaymentProvider
│   │   ├── email/       # NodemailerEmailProvider
│   │   ├── whatsapp/    # WhatsappProvider
│   │   ├── qrcode/      # QrCodeProvider
│   │   └── storage/     # LocalStorageProvider, S3StorageProvider
│   ├── cache/           # RedisCache
│   ├── queue/           # BullMQ workers
│   └── config/          # env.ts — validation Zod des variables d'env
│
└── presentation/        # Couche HTTP — aucune logique métier
    ├── routes/
    ├── controllers/
    ├── middlewares/
    └── docs/            # Swagger OpenAPI
```

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur en mode watch (tsx) |
| `npm run build` | Compilation TypeScript |
| `npm start` | Démarrer le build de production |
| `npm run db:migrate:dev` | Créer + appliquer une migration |
| `npm run db:migrate` | Appliquer les migrations (production) |
| `npm run db:seed` | Insérer les données de test |
| `npm run db:studio` | Ouvrir Prisma Studio |
| `npm test` | Lancer tous les tests |
| `npm run test:coverage` | Tests + rapport de couverture |

---

## Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@demo-events.com | Admin1234! |
| Agent Scanner | agent@demo-events.com | Agent1234! |

---

## Flux d'achat de ticket

```
1. GET  /api/v1/events/:slug          → page événement
2. POST /api/v1/orders                → créer commande + initier paiement
3.      → redirect vers page Kkiapay
4. POST /api/v1/webhooks/kkiapay      → webhook reçu (paiement confirmé)
5.      → vérification + création ticket
6.      → génération QR code
7.      → envoi Email + WhatsApp
8. GET  /t/:token                     → page ticket avec QR
9. POST /api/v1/checkin               → scan QR à l'entrée
```

---

## Prochaines étapes

1. Implémenter les routes Express (controllers + routes)
2. Ajouter le middleware d'authentification JWT
3. Implémenter ValidatePaymentUseCase + webhook handler
4. Implémenter GenerateTicketUseCase (QR + PDF)
5. Implémenter les providers Email et WhatsApp
6. Ajouter les BullMQ workers pour les envois async
7. Créer le dashboard organisateur
8. Écrire les tests (unit + integration + API)
