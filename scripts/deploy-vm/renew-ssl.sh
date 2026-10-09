#!/bin/bash
# Renovacion no interactiva del certificado y recarga segura de Nginx.
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_DIR"

docker run --rm \
    -v "$PROJECT_DIR/nginx/certbot/conf:/etc/letsencrypt" \
    -v "$PROJECT_DIR/nginx/certbot/www:/var/www/certbot" \
    certbot/certbot renew \
    --webroot \
    --webroot-path=/var/www/certbot \
    --quiet

docker compose exec -T nginx nginx -s reload
