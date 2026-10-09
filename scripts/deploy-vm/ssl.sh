#!/bin/bash
# ==============================================================================
# ssl.sh — Obtener certificado SSL y reiniciar nginx
# Uso:  bash ssl.sh tu-dominio.com
# ==============================================================================
set -e

DOMAIN="${1:?Uso: bash ssl.sh tu-dominio.com}"

echo "=== 1. Verificar DNS (debe resolver a esta VM) ==="
DOMAIN_IP=$(dig +short "$DOMAIN" | tail -1)
VM_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
echo "Dominio: $DOMAIN -> $DOMAIN_IP"
echo "VM:      $VM_IP"
if [ "$DOMAIN_IP" != "$VM_IP" ]; then
    echo "!! ADVERTENCIA: el dominio no apunta a esta VM todavía."
    echo "   Espera la propagación DNS (hasta 30 min) y reintentar."
    exit 1
fi

echo "=== 2. Asegurar que nginx.conf tiene el dominio ==="
# El certbot necesita servir el desafío ACME primero
# El nginx.conf ya tiene la ruta /.well-known/acme-challenge

echo "=== 3. Levantar nginx sin SSL primero (para el challenge) ==="
# Creamos un conf temporal solo para el challenge
cat > /tmp/nginx-acme.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 404; }
}
EOF
docker run -d --name nginx-acme \
    -p 80:80 \
    -v ~/scia/nginx/certbot/www:/var/www/certbot:ro \
    -v /tmp/nginx-acme.conf:/etc/nginx/conf.d/default.conf:ro \
    nginx:1.27-alpine 2>/dev/null || docker restart nginx-acme

echo "=== 4. Obtener certificado Let's Encrypt ==="
docker run -it --rm \
    -v ~/scia/nginx/certbot/conf:/etc/letsencrypt \
    -v ~/scia/nginx/certbot/www:/var/www/certbot \
    certbot/certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    -d "$DOMAIN" --email=scia-contact@proton.me --agree-tos --no-eff-email

echo "=== 5. Aplicar dominio a nginx.conf ==="
# Reemplazar tu-dominio por el dominio real en las líneas ssl_certificate
sed -i "s|/live/tu-dominio/|/live/$DOMAIN/|g" ~/scia/nginx/nginx.conf
grep "ssl_certificate" ~/scia/nginx/nginx.conf

echo "=== 6. Reconstruir stack completo ==="
docker stop nginx-acme 2>/dev/null || true
docker rm nginx-acme 2>/dev/null || true
cd ~/scia
docker compose up -d

echo "=== 7. Verificar HTTPS ==="
sleep 5
curl -s -o /dev/null -w "HTTPS: %{http_code}\n" "https://$DOMAIN/health"
curl -sI "https://$DOMAIN" | grep -E "server|HTTP"

echo ""
echo "=== SSL ACTIVADO ==="
echo "Renovación automática: agrega a crontab:"
echo '0 3 * * * docker run --rm -v ~/scia/nginx/certbot/conf:/etc/letsencrypt -v ~/scia/nginx/certbot/www:/var/www/certbot certbot/certbot renew --quiet && docker kill --signal=SIGHUP $(docker ps -q --filter name=scia-nginx)'
