#!/bin/bash
# ssl.sh — Obtiene el certificado TLS y levanta el stack productivo.
# Uso: bash scripts/deploy-vm/ssl.sh [dominio]
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOMAIN="${1:-scia-vm-salud-conecta.northcentralus.cloudapp.azure.com}"
CERT_DIR="$PROJECT_DIR/nginx/certbot/conf"
WEBROOT_DIR="$PROJECT_DIR/nginx/certbot/www"
CERT_PATH="$CERT_DIR/live/$DOMAIN/fullchain.pem"
FALLBACK_CONTAINER="scia-http-fallback"
CERTBOT_CONTAINER="scia-certbot"

cd "$PROJECT_DIR"
mkdir -p "$CERT_DIR" "$WEBROOT_DIR"

remove_temporary_containers() {
    docker rm -f "$CERTBOT_CONTAINER" nginx-acme "$FALLBACK_CONTAINER" >/dev/null 2>&1 || true
}

start_http_fallback() {
    echo "Restaurando acceso HTTP de respaldo..."
    docker compose up -d --build app
    docker rm -f "$FALLBACK_CONTAINER" >/dev/null 2>&1 || true
    docker run -d \
        --name "$FALLBACK_CONTAINER" \
        --restart unless-stopped \
        --network scia-net \
        -p 80:80 \
        -v "$PROJECT_DIR/nginx/nginx.http.conf:/etc/nginx/conf.d/default.conf:ro" \
        -v "$WEBROOT_DIR:/var/www/certbot:ro" \
        nginx:1.27-alpine >/dev/null
}

on_exit() {
    exit_code=$?
    if [ "$exit_code" -ne 0 ]; then
        echo "ERROR: no se pudo activar HTTPS (codigo $exit_code)."
        docker compose stop nginx >/dev/null 2>&1 || true
        remove_temporary_containers
        start_http_fallback || true
        echo "La aplicacion queda disponible por HTTP; revisa el error de Certbot mostrado arriba."
    fi
}
trap on_exit EXIT
trap 'exit 130' INT TERM

echo "=== 1. Preparar aplicacion y red Docker ==="
docker compose up -d --build app

echo "=== 2. Liberar puertos 80/443 y limpiar intentos anteriores ==="
docker compose stop nginx >/dev/null 2>&1 || true
remove_temporary_containers

if [ ! -s "$CERT_PATH" ]; then
    echo "=== 3. Obtener certificado de Let's Encrypt para $DOMAIN ==="
    CERTBOT_REGISTRATION=(--register-unsafely-without-email)
    if [ -n "${CERTBOT_EMAIL:-}" ]; then
        CERTBOT_REGISTRATION=(--email "$CERTBOT_EMAIL")
    fi

    docker run --rm \
        --name "$CERTBOT_CONTAINER" \
        -p 80:80 \
        -v "$CERT_DIR:/etc/letsencrypt" \
        certbot/certbot certonly \
        --standalone \
        --preferred-challenges http \
        -d "$DOMAIN" \
        --agree-tos \
        --non-interactive \
        --no-eff-email \
        "${CERTBOT_REGISTRATION[@]}"
else
    echo "=== 3. Certificado existente encontrado; no se solicita uno nuevo ==="
fi

test -s "$CERT_PATH"

echo "=== 4. Levantar stack HTTPS ==="
remove_temporary_containers
docker compose up -d --build

echo "=== 5. Verificar salud HTTPS ==="
healthy=false
for _ in $(seq 1 12); do
    if curl --fail --silent --show-error "https://$DOMAIN/health" >/dev/null; then
        healthy=true
        break
    fi
    sleep 5
done

if [ "$healthy" != true ]; then
    echo "ERROR: el servicio no respondio correctamente por HTTPS."
    docker compose ps
    docker compose logs --tail=100 app nginx
    exit 1
fi

trap - EXIT
echo "HTTPS activo: https://$DOMAIN"
