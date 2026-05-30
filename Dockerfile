# ─── Stage 1 : Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances d'abord (cache Docker)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Copier le source et compiler
COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

# ─── Stage 2 : Production ────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Dépendances de production uniquement
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copier les artefacts du builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/

# Créer un user non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && adduser -S ticketflow -u 1001
USER ticketflow

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
