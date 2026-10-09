#!/bin/bash
# deploy.sh — Despliegue automatizado de Salud-Conecta IA en la VM Azure.
# Uso: bash scripts/deploy-vm/deploy.sh [dominio]
set -Eeuo pipefail

DOMAIN="${1:-scia-vm-salud-conecta.northcentralus.cloudapp.azure.com}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== 1. Verificar Docker ==="
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    echo "Docker fue instalado. Cierra la sesion SSH, vuelve a entrar y ejecuta este script otra vez."
    exit 0
fi
docker --version
docker compose version

echo "=== 2. Actualizar codigo ==="
cd "$PROJECT_DIR"
git pull --ff-only origin main

echo "=== 3. Verificar configuracion ==="
mkdir -p nginx/certbot/conf nginx/certbot/www
if [ ! -f .env ]; then
    echo "ERROR: falta $PROJECT_DIR/.env. Copia .env.example y agrega los valores reales."
    exit 1
fi
chmod 600 .env

# Mantener protegido el endpoint de notificaciones aunque CRON_SECRET se haya
# omitido o se haya dejado con el valor de ejemplo.
cron_secret="$(grep -E '^CRON_SECRET=' .env | tail -n 1 | cut -d= -f2- || true)"
if [ -z "$cron_secret" ] || [[ "$cron_secret" == *"tu_"* || "$cron_secret" == *"_aqui"* ]]; then
    cron_secret="$(openssl rand -hex 32)"
    if grep -q '^CRON_SECRET=' .env; then
        sed -i "s|^CRON_SECRET=.*|CRON_SECRET=$cron_secret|" .env
    else
        printf '\nCRON_SECRET=%s\n' "$cron_secret" >> .env
    fi
    chmod 600 .env
    echo "Se genero un CRON_SECRET aleatorio y se guardo en .env."
fi

required_variables=(VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY GEMINI_API_KEY CRON_SECRET FRONTEND_URL)
for variable in "${required_variables[@]}"; do
    value="$(grep -E "^${variable}=" .env | tail -n 1 | cut -d= -f2- || true)"
    if [ -z "$value" ] || [[ "$value" == *"tu_"* || "$value" == *"_aqui"* || "$value" == *"tu-proyecto"* ]]; then
        echo "ERROR: $variable no esta configurada con un valor real en .env."
        exit 1
    fi
done

frontend_url="$(grep -E '^FRONTEND_URL=' .env | tail -n 1 | cut -d= -f2- | sed 's:/*$::')"
expected_frontend="https://$DOMAIN"
if [ "$frontend_url" != "$expected_frontend" ]; then
    echo "ERROR: FRONTEND_URL debe ser exactamente $expected_frontend para que CORS coincida con el dominio desplegado."
    exit 1
fi

echo "=== 4. Construir aplicacion ==="
docker compose up -d --build app

echo "=== 5. Verificar salud interna ==="
healthy=false
for _ in $(seq 1 12); do
    if docker compose exec -T app wget -qO- http://127.0.0.1:3000/health >/dev/null 2>&1; then
        healthy=true
        break
    fi
    sleep 5
done
if [ "$healthy" != true ]; then
    docker compose logs --tail=100 app
    echo "ERROR: la aplicacion no supero la comprobacion de salud."
    exit 1
fi

echo "=== 6. Configurar HTTPS ==="
bash scripts/deploy-vm/ssl.sh "$DOMAIN"

echo "=== 7. Programar renovacion automatica del certificado ==="
RENEW_SCRIPT="$PROJECT_DIR/scripts/deploy-vm/renew-ssl.sh"
CRON_MARKER="# salud-conecta-renew-ssl"
CRON_LINE="17 3 * * * bash $RENEW_SCRIPT >> $PROJECT_DIR/nginx/certbot/renew.log 2>&1 $CRON_MARKER"
(
    crontab -l 2>/dev/null | grep -vF "$CRON_MARKER" || true
    echo "$CRON_LINE"
) | crontab -

echo "Despliegue completado: https://$DOMAIN"
