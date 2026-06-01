# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copie du code source
COPY . .

# Build du projet Vite
RUN npm run build 2>&1 || true

# Stage 2: Production (Serveur Web Nginx)
FROM nginx:alpine

# Suppression de la configuration par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copie des fichiers compilés de Vite (le fameux dossier dist)
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx optimisée pour une SPA (Vite/React/Vue)
RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Toutes les routes sont redirigées vers index.html (pour le router côté client)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Compression Gzip pour accélérer le chargement
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;
}
NGINX

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]