# ==============================================================================
# Salud-Conecta IA — Imagen de aplicación (Node + Express)
# Multi-stage: build optimizado + runtime ligero, usuario no-root
# ==============================================================================

# ---------- ETAPA 1: CONSTRUCCIÓN ----------
FROM node:22-alpine AS builder

WORKDIR /build

# Copiar manifiestos y configuración npm para peer dependencies
COPY package*.json .npmrc* ./

# Dependencias completas con soporte para React 19 peer-deps
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copiar código y compilar assets estáticos + servidor
COPY . .

# Argumentos para compilación de frontend Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_CARTO_API_KEY
ARG VITE_VAPID_PUBLIC_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_CARTO_API_KEY=$VITE_CARTO_API_KEY \
    VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

RUN npm run build

# ---------- ETAPA 2: RUNTIME ----------
FROM node:22-alpine AS production

# Variables por defecto (se sobrescriben con variables de Azure/VM)
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

WORKDIR /app

# Instalar solo dependencias de producción
COPY --from=builder /build/package*.json /build/.npmrc* ./
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts && npm cache clean --force

# Copiar assets compilados + servidor empaquetado (dist/server.cjs)
COPY --from=builder /build/dist ./dist

# Datos leídos en runtime por /api/admin/metrics (src/data/simulatedMetrics.json)
COPY --from=builder /build/src/data ./src/data

# Usuario no-root (requisito: entornos estrictamente aislados)
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# Healthcheck ligero contra el endpoint /health (monitoreo básico)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health > /dev/null || exit 1

CMD ["node", "dist/server.cjs"]
