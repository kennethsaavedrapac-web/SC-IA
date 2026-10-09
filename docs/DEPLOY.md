# Despliegue en Azure — Salud-Conecta IA

Requisitos cubiertos: build comprimido, servidor seguro (usuario no-root), proxy inverso (nginx), contenedores (Docker), CORS + variables ocultas.

## Arquitectura

```
Internet → [Azure VM] → nginx (:80/:443, SSL) → app Docker (:3000) → Supabase (gestionado)
```

- **nginx**: único punto de entrada. SSL, gzip, headers de seguridad, proxy a `app:3000`.
- **app**: contenedor Node 20 Alpine, usuario `nodejs` (no root), healthcheck `/health`.
- **Supabase**: se mantiene gestionado (no se dockeriza).

## Prerrequisitos

- Cuenta de Azure (plan estudiante: VM B1s ≈ $13/mes, crédito de $200).
- Dominio apuntando a la IP pública de la VM.
- Variables de Supabase, Gemini, CARTO, VAPID (ver `.env.example`).

## Fase 1 — Repo (ya hecho)

- [x] `Dockerfile` multi-stage, usuario no-root, healthcheck.
- [x] `docker-compose.yml` (app + nginx, red interna).
- [x] `nginx/nginx.conf` (SSL, gzip, headers, proxy).
- [x] `.dockerignore` (sin `.env`, `node_modules`, `dist`).
- [x] `vite.config.ts`: `sourcemap: false`, `minify: esbuild`, `drop: ['console','debugger']` en prod.
- [x] `server.ts`: `PORT` por env var, `trust proxy`, endpoint `/health`.
- [x] Build verificado: `npm run build` → `dist/` (~8.5s).

## PRE-REQUISITO CRÍTICO: editar el dominio en nginx.conf

Antes de `docker compose up`, abre `nginx/nginx.conf` y reemplaza **`tu-dominio`** (aparece 2 veces en la línea de `ssl_certificate`) por tu dominio real. nginx NO acepta variables en `ssl_certificate` — la ruta debe ser fija.

## Datos reales de la VM (creada)

- **IP pública**: `23.100.238.241`
- **Región**: `northcentralus` (North Central US / Chicago) — única región que acepta Azure for Students INATEC
- **Tamaño**: `Standard_B2ats_v2` (2 vCPU, 4 GB RAM) — B1s está **bloqueado** en esta suscripción (restricción Location)
- **NSG**: puertos 22 (SSH), 80 (HTTP), 443 (HTTPS). El puerto 3000 **NO** está abierto.
- **Usuario**: `scuser` (no-root), clave privada en `C:\Users\juanp\.ssh\scia\id_rsa`

> ⚠️ **Regiones bloqueadas por política**: brazilsouth, eastus, centralus, eastus2.
> **Tamaños bloqueados**: Standard_B1s, B1ms, B2s, B2ms, B2ts_v2 (todos con restricción "Location").
> **Tamaños permitidos**: B2als_v2, B2as_v2, B2ats_v2, B2ps_v2, B2pls_v2 (sin restricciones).

## Fase 2 — Azure (ya hecho)

La VM ya existe. Conéctate desde tu PC:

```powershell
# PowerShell (Windows)
icacls C:\Users\juanp\.ssh\scia\id_rsa /inheritance:r
ssh -i C:\Users\juanp\.ssh\scia\id_rsa scuser@23.100.238.241
```

Dentro de la VM, instalar Docker:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker ps
```

## Fase 3 — Subir código y desplegar (en la VM)

```bash
cd ~
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/kennethsaavedrapac-web/SC-IA.git scia
cd scia

# Crear .env con valores reales (NUNCA subir a git)
nano .env
# Pega las variables reales de Supabase, Gemini, CARTO, VAPID
# FRONTEND_URL=https://TU-DOMINIO-REAL
# NODE_ENV=production

mkdir -p nginx/certbot/conf nginx/certbot/www
docker compose up -d --build
docker compose ps    # app debe decir "healthy", nginx "running"
```

## Fase 4 — Dominio + SSL

1. En tu registrador: registro **A** → `@` → `23.100.238.241` (y `www` si aplica)
2. Verifica DNS: `nslookup TU-DOMINIO` desde tu PC
3. Certificado Let's Encrypt:

```bash
docker run -it --rm \
  -v ~/scia/nginx/certbot/conf:/etc/letsencrypt \
  -v ~/scia/nginx/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d TU-DOMINIO --email=tu-email --agree-tos --no-eff-email

docker compose restart nginx
```

⚠️ **Antes de levantar nginx**: edita `nginx/nginx.conf` y reemplaza las 2 apariciones de `tu-dominio` por tu dominio real (nginx NO acepta variables en ssl_certificate).

## Fase 5 — Validación

```powershell
# Desde tu PC
curl.exe -I https://TU-DOMINIO          # debe decir "server: nginx"
curl.exe https://TU-DOMINIO/health      # {"status":"ok",...}
curl.exe --max-time 5 http://23.100.238.241:3000   # debe TIMEOUT (puerto cerrado)
```

## Monitoreo básico

- `docker compose logs -f app` — logs en vivo
- Azure Portal → scia-vm → Monitoring → Metrics (CPU/memoria/red) — gratis
- Alerts: CPU > 80% por 5 min → email
- El HEALTHCHECK de Docker reinicia app si /health falla 3 veces

## Solución de problemas

| Síntoma | Arreglo |
|---|---|
| `docker compose ps` muestra app unhealthy | `docker compose logs app` |
| nginx 502 | app no arrancó — revisa logs |
| SSL not found | dominio no coincide con nginx.conf |
| :3000 accesible desde internet | NSG — elimina regla del 3000 (no debe existir) |
| SSH falla | verifica permisos del id_rsa con icacls |

**Costo**: Standard_B2ats_v2 ≈ $30-40/mes (tu crédito de $200 cubre ~5-6 meses). Para detener: `az vm deallocate -g scia-rg -n scia-vm` (libera el cómputo, mantiene el disco).

1. **Crear VM**: Ubuntu 22.04, tamaño B1s, usuario estándar (p. ej. `scuser`), SSH key.
   - NSG: permitir 22 (solo tu IP), 80, 443. Denegar 3000.
2. **Conectar**: `ssh scuser@<IP_PÚBLICA>`.
3. **Instalar Docker**:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER   # reiniciar sesión después
   ```
4. **Subir el repo** (sin `.env`, sin `node_modules`):
   ```bash
   # Desde tu máquina (Windows): instalar rsync o usar scp/git
   scp -r ./* scuser@<IP>:/home/scuser/scia/
   ```
5. **Configurar variables** en la VM (`/home/scuser/scia/.env`):
   ```bash
   # ¡Usa valores reales, NO los de .env.example!
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   GEMINI_API_KEY=...
   VITE_CARTO_API_KEY=...
   VITE_VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   VAPID_SUBJECT=...
   CRON_SECRET=...
   FRONTEND_URL=https://tu-dominio
   NODE_ENV=production
   ```
6. **Dominio**: apuntar el registro A del dominio a la IP pública de la VM.
7. **Levantar**:
   ```bash
   cd /home/scuser/scia
   docker compose up -d --build
   docker compose ps      # ambos servicios "healthy"/"running"
   ```

## SSL (Let's Encrypt)

Primera vez (en la VM):
```bash
docker run -it --rm \
  -v /home/scuser/scia/nginx/certbot/conf:/etc/letsencrypt \
  -v /home/scuser/scia/nginx/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d tu-dominio --email tu-email --agree-tos --no-eff-email
```
Renovación automática (cron en la VM):
```bash
echo "0 3 * * * docker run --rm -v /home/scuser/scia/nginx/certbot/conf:/etc/letsencrypt -v /home/scuser/scia/nginx/certbot/www:/var/www/certbot certbot/certbot renew --quiet && docker kill --signal=SIGHUP \$(docker ps -q --filter name=scia-nginx)" | sudo tee /etc/cron.d/scia-certbot
```

## Fase 3 — Validación

```bash
# Proxy funciona (debe responder nginx, no Express)
curl -I https://tu-dominio

# CORS correcto
curl -H "Origin: https://tu-dominio" -I https://tu-dominio/health

# Puerto 3000 NO accesible desde internet (timeout)
curl --max-time 3 http://<IP_PÚBLICA>:3000   # debe fallar

# Health
curl https://tu-dominio/health
```

## Monitoreo básico

- `docker compose logs -f app` — logs en vivo.
- Azure Portal → VM → Metrics (CPU, memoria, red) — gratis.
- Alertas: VM → Alerts → regla por % CPU > 80% por 5 min → email.
- El `HEALTHCHECK` de Docker reinicia el contenedor si `/health` falla 3 veces.

## Notas de seguridad

- Las variables sensibles viven **solo** en la VM (`/home/scuser/scia/.env`), nunca en el repo ni en la imagen Docker.
- El contenedor app corre como usuario `nodejs` (uid 1001), no root.
- nginx es el único puerto expuesto; `app` solo escucha en la red interna `scia-net`.
- Cookies de sesión: `HttpOnly`, `Secure`, `SameSite=None` (ya en `server.ts`).
