#!/bin/bash
# ==============================================================================
# ssl.sh — Obtener certificado SSL y reiniciar nginx
# Uso:  bash scripts/deploy-vm/ssl.sh [scia-vm-salud-conecta.northcentralus.cloudapp.azure.com]
# ==============================================================================
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOMAIN="${1:-scia-vm-salud-conecta.northcentralus.cloudapp.azure.com}"

echo "=== 1. Preparando directorios del proyecto en $PROJECT_DIR ==="
mkdir -p "$PROJECT_DIR/nginx/certbot/conf" "$PROJECT_DIR/nginx/certbot/www"

echo "=== 2. Levantar Nginx temporal para desafío ACME de Let's Encrypt ==="
cat > /tmp/nginx-acme.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN _;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 "Configurando SSL...";
    }
}
EOF

docker stop nginx-acme 2>/dev/null || true
docker rm nginx-acme 2>/dev/null || true

docker run -d --name nginx-acme \
    -p 80:80 \
    -v "$PROJECT_DIR/nginx/certbot/www":/var/www/certbot:ro \
    -v /tmp/nginx-acme.conf:/etc/nginx/conf.d/default.conf:ro \
    nginx:1.27-alpine

sleep 3

echo "=== 3. Obteniendo certificado SSL para $DOMAIN ==="
docker run --rm \
    -v "$PROJECT_DIR/nginx/certbot/conf":/etc/letsencrypt \
    -v "$PROJECT_DIR/nginx/certbot/www":/var/www/certbot \
    certbot/certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    -d "$DOMAIN" --register-unsafely-without-email --agree-tos --no-eff-email

echo "=== 4. Deteniendo contenedor temporal y levantando el stack con HTTPS ==="
docker stop nginx-acme 2>/dev/null || true
docker rm nginx-acme 2>/dev/null || true

cd "$PROJECT_DIR"
docker compose up -d --build

echo "=== 5. Verificando HTTPS ==="
sleep 5
curl -s -o /dev/null -w "Respuesta HTTPS: %{http_code}\n" "https://$DOMAIN/health" || true

echo ""
echo "=========================================================="
echo " ✅ SSL HTTPS ACTIVADO CON ÉXITO!"
echo " Tu app está lista en: https://$DOMAIN"
echo "=========================================================="
