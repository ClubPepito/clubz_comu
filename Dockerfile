# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copie du code source
COPY . .

# Build (en ignorant les erreurs comme tu l'as demandé)
RUN npm run build 2>&1 || true

# Stage 2: Production (Runner natif)
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Next.js écoutera sur ce port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copie des assets statiques (images, polices...)
COPY --from=builder /app/public ./public

# Copie du moteur Standalone de Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Next.js démarre directement via Node, sans Nginx
CMD ["node", "server.js"]