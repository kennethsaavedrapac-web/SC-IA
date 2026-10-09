# ==============================================================================
# Salud-Conecta IA — Imagen de aplicación (Node + Express)
# Multi-stage: build optimizado + runtime ligero, usuario no-root
# ==============================================================================

# ---------- ETAPA 1: CONSTRUCCIÓN ----------
FROM node:20-alpine AS builder

WORKDIR /build

# Copiar solo manifestos primero para aprovechar caché de capas
COPY package*.json ./

# Dependencias completas (vite/tsx se necesitan para el build)
RUN npm ci --ignore-scripts

# Copiar código y compilar assets estáticos + servidor
COPY . .

RUN npm run build

# ---------- ETAPA 2: RUNTIME ----------
FROM node:20-alpine AS production

# Variables por defecto (se sobrescriben con variables de Azure/VM)
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

WORKDIR /app

# Instalar solo dependencias de producción
COPY --from=builder /build/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

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
