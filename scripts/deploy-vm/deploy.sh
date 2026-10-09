#!/bin/bash
# ==============================================================================
# deploy.sh — Despliegue automatizado de SC-IA en la VM Azure
# Uso:  bash deploy.sh
# Requisito: ya estar conectado por SSH como scuser, con el repo clonado en ~/scia
# ==============================================================================
set -e

DOMAIN="${1:-TU_DOMINIO_AQUI}"   # pasa tu dominio como argumento

echo "=== 1. Instalar Docker ==="
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    newgrp docker
fi
docker --version

echo "=== 2. Clonar/actualizar código ==="
if [ ! -d ~/scia ]; then
    sudo apt-get update && sudo apt-get install -y git
    git clone https://github.com/kennethsaavedrapac-web/SC-IA.git ~/scia
fi
cd ~/scia
git pull origin main 2>/dev/null || true

echo "=== 3. Directorios para certificados ==="
mkdir -p nginx/certbot/conf nginx/certbot/www

echo "=== 4. Verificar .env ==="
if [ ! -f .env ]; then
    echo "!! ERROR: crea primero ~/scia/.env con tus variables reales (ver docs/DEPLOY.md)"
    echo "   Copia .env.example y completa: Supabase, Gemini, CARTO, VAPID, FRONTEND_URL=$DOMAIN"
    exit 1
fi
echo ".env encontrado ($(wc -l < .env) líneas)"

echo "=== 5. Construir y levantar contenedores ==="
docker compose up -d --build
sleep 10
docker compose ps

echo "=== 6. Verificar salud ==="
curl -s http://localhost:3000/health && echo " <- /health (app)"
curl -s -o /dev/null -w "nginx:80 -> HTTP %{http_code}\n" http://localhost/health

echo ""
echo "=== LISTO (sin SSL aún) ==="
echo "Para activar HTTPS, ejecuta:"
echo "  bash ssl.sh $DOMAIN"
