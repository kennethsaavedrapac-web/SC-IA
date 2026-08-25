# Salud-Conecta IA (v1.3.0)

<div align="center">
  <img width="1200" height="475" alt="Banner Salud-Conecta IA" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

Bienvenido a **Salud-Conecta IA**, un asistente médico virtual, asesor de triaje clínico inteligente y plataforma de salud digital adaptada a la realidad geográfica, cultural y tecnológica de Nicaragua. 

Esta solución unifica la inteligencia artificial de última generación de **Google Gemini** con la infraestructura en tiempo real y autenticación segura de **Supabase**, autenticación de doble factor (2FA/MFA TOTP), interoperabilidad clínica bajo el estándar internacional **HL7 FHIR R4**, y motores de triaje sin conexión (Offline) diseñados específicamente para lenguas originarias y comunidades del Caribe nicaragüense.

---

## 🚀 Funcionalidades Principales

La plataforma opera como una **Progressive Web App (PWA)** reactiva, accesible desde cualquier navegador, ordenador de escritorio o dispositivo móvil Android/iOS.

```
                  ┌──────────────────────────────────────────────┐
                  │              Salud-Conecta IA                │
                  └──────────────────────┬───────────────────────┘
                                         │
     ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
     ▼                   ▼                               ▼                   ▼
┌──────────────┐ ┌───────────────┐               ┌───────────────┐   ┌───────────────┐
│ Triaje con   │ │ Triaje Offline│               │ Ficha Médica  │   │ Seguridad     │
│ Google Gemini│ │ Intercultural │               │ QR & PDF FHIR │   │ 2FA / MFA     │
│ (24/7 MINSA) │ │ Miskito/Kriol │               │ HL7 R4 Export │   │ TOTP & Backup │
└──────────────┘ └───────────────┘               └───────────────┘   └───────────────┘
```

### 1. Triaje Virtual Inteligente con IA (Google Gemini)
* **Evaluación Dinámica de Síntomas:** Chat conversacional que analiza los síntomas reportados, clasifica la gravedad y entrega recomendaciones preliminares claras y empáticas:
  * 🔴 **Alta urgencia:** Despliega advertencias prioritarias, protocolos de emergencia y botones de llamada inmediata (Cruz Roja 128 / Emergencias 118).
  * 🟡 **Moderado:** Sugiere pautas de vigilancia activa y consulta médica programada.
  * 🟢 **Leve:** Ofrece recomendaciones de autocuidado, reposo e hidratación.
* **Conciencia Espacio-Temporal y Red MINSA:** Evalúa dinámicamente la hora y día en la zona horaria de Nicaragua (`America/Managua`). Si la consulta ocurre fuera del horario regular del MINSA (Lunes a Viernes, 08:00 AM - 04:00 PM), la IA reprime derivaciones a centros de salud comunitarios cerrados y redirige de forma prioritaria a **hospitales de referencia con atención de emergencias 24/7**.
* **Contexto Clínico Seguro:** Incorpora condiciones preexistentes, alergias, tipo de sangre y antecedentes sanitizados del perfil del usuario para ajustar la ponderación de riesgo.

### 2. Triajes Especializados e Interculturales (100% Offline)
Para garantizar el acceso a la salud en zonas remotas o ante fallos de conectividad en la Costa Caribe:
* **Idiomas Nativos e Interculturales:**
  * **Miskito (Miskitu):** Motor de triaje y base de conocimientos clínicos completamente en lengua miskita.
  * **Kriol (Caribeño):** Motor de triaje y cuestionario clínico en inglés criollo nicaragüense.
  * **Español Offline:** Motor de triaje de contingencia basado en matriz de signos de peligro y síntomas clave.
* **Ejecución Local:** Algoritmos deterministas e indexados que evalúan combinaciones de signos vitales y síntomas directamente en la memoria del navegador, sin enviar paquetes a la red.

### 3. Autenticación Robusta y Seguridad de Dos Factores (2FA / MFA)
* **TOTP Estándar (RFC 6238):** Compatible con Google Authenticator, Microsoft Authenticator, Authy y 1Password.
* **Enrolamiento con Código QR y Clave Manual:** Generación interactiva de secretos Base32, URL `otpauth://` y renderizado de código QR.
* **Códigos de Respaldo (Backup Codes):** Generación de 8 códigos de recuperación de un solo uso con opción de copiado y descarga en archivo `.txt`.
* **Desafíos en Login (2FA Challenge):** Bloqueo y verificación en dos pasos para roles privilegiados (Administradores, Médicos) y usuarios con 2FA habilitado.
* **Código de Respaldo por Correo:** Envío alternativo de código temporal por email con temporizador de enfriamiento (*cooldown*) de 60 segundos.
* **Gestión Segura de Sesión:** Emisión de cookies `HttpOnly`, `SameSite=Strict`, `Secure` (`sc_auth_token`) para mitigar vulnerabilidades XSS/CSRF.

### 4. Ficha Médica de Emergencia (QR, PDF e Interoperabilidad FHIR)
* **Tarjeta QR de Emergencia:** Genera un código QR cifrado/estructurado con datos vitales (tipo de sangre, alergias, contactos SOS, padecimientos) con el logotipo institucional integrado.
* **Exportación en PDF y Captura de Imagen:** Descarga directa de la ficha médica en alta resolución mediante `jspdf` y `html-to-image`.
* **Estándar Internacional HL7 FHIR R4:** Mapeo de perfiles clínicos a recursos interoperables (`Patient`, `Condition`, `AllergyIntolerance`, `Observation`) listos para sincronización con expedientes electrónicos hospitalarios y Google Cloud Healthcare API.

### 5. Directorio de Unidades de Salud y Farmacias de Turno
* **Mapa Interactivo y Filtros Geográficos:** Localización y filtrado por SILAIS, departamento, municipio y tipo de unidad (Hospitales, Centros de Salud, Puestos Médicos, Clínicas Privadas).
* **Farmacias de Turno en Tiempo Real:** Visualización de disponibilidad, horarios, medicamentos en inventario y diseño optimizado (`min-h-[280px]`) para dispositivos móviles.
* **Acciones Inmediatas:** Trazado de rutas hacia la unidad médica con OpenStreetMap y enlace directo a WhatsApp para consultas farmacéuticas.

### 6. Panel de Administración y Control Centralizado
* **Configuración Dinámica de IA:** Cambio en caliente del modelo de Gemini (`gemini-2.5-flash-lite`, `gemini-1.5-pro`, etc.) sin reiniciar servidores ni recompilar el código.
* **Modo Mantenimiento Global:** Bloqueo temporal del acceso a usuarios no administradores con pantallas informativas del MINSA.
* **Gestión de Anuncios y Alertas:** Publicación de avisos urgentes con rango de vigencia y sincronización instantánea vía Supabase Realtime Channels.
* **Métricas y Monitoreo del Servidor:** Dashboard analítico con cálculo en vivo de carga del servidor, usuarios activos y volumen de triajes por hora.
* **Gestión de Centros de Salud y Usuarios:** CRUD exhaustivo de usuarios, roles (paciente, médico, admin) y coordenadas geoespaciales.

### 7. Progressive Web App (PWA) y Notificaciones Push
* **Instalación Nativa:** Banner personalizado y soporte guiado paso a paso para iOS (Safari) y Android (Chrome).
* **Caché Inteligente con Service Worker:** Precaché versionado (`public/sw.js`) para carga instantánea y funcionamiento sin internet.
* **Notificaciones Push VAPID:** Suscripción y recepción de avisos sanitarios, recordatorios médicos y alertas epidemiológicas mediante el estándar Web Push.
* **Notificación Adaptativa de Nuevas Versiones:** Detección de compilaciones nuevas con Toast en Desktop y Bottom Sheet en pantallas táctiles (con supresión inteligente de 24h).

---

## 🏛️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLIENTE PWA (React 19 + Vite + Tailwind v4)           │
│                                                                             │
│  ┌────────────────────┐   ┌────────────────────┐   ┌─────────────────────┐  │
│  │   AuthContext      │   │  Triajes Offline   │   │     Service Worker  │  │
│  │   (Sesión + 2FA)   │   │  (ES / MI / KR)    │   │  (sw.js + Web Push) │  │
│  ├────────────────────┤   ├────────────────────┤   ├─────────────────────┤  │
│  │   LanguageContext  │   │  EmergencyQR &     │   │  Validador Zod      │  │
│  │   (4 Idiomas)      │   │  Exportación FHIR  │   │  (Formularios)      │  │
│  └─────────┬──────────┘   └─────────┬──────────┘   └──────────┬──────────┘  │
└────────────┼────────────────────────┼─────────────────────────┼─────────────┘
             │                        │                         │
             ▼                        ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CAPA DE BACKEND (Node.js Express / Vercel Edge)          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Middlewares de Seguridad: Helmet (CSP) • CORS • Express Rate Limit    │  │
│  │ Gestión de Cookies HttpOnly (sc_auth_token) • CookieParser           │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────┬───────────────┴───────────────┬───────────────────┐  │
│  │ /api/chat         │ /api/auth/2fa/*               │ /api/fhir*        │  │
│  │ (Proxy Gemini IA) │ (TOTP, Challenge, Verify)     │ (HL7 R4 FHIR API) │  │
│  └─────────┬─────────┴───────────────┬───────────────┴─────────┬─────────┘  │
└────────────┼─────────────────────────┼─────────────────────────┼────────────┘
             │                         │                         │
             ▼                         ▼                         ▼
┌─────────────────────────┐ ┌─────────────────────┐ ┌─────────────────────────┐
│     Google Gemini AI    │ │  Supabase Platform  │ │   Web-Push / VAPID      │
│  (Modelos Generativos)  │ │ (PostgreSQL/Realtime│ │ (Notificaciones Push)   │
│                         │ │  & Auth / Storage)  │ │                         │
└─────────────────────────┘ └─────────────────────┘ └─────────────────────────┘
```

---

## 📂 Estructura del Código Fuente

```
salud-conecta-ia/
├── api/                             # Endpoints Serverless (Vercel & Desarrollo Local)
│   ├── _lib/                        # Utilidades internas del backend
│   │   ├── fhir-builders.js         # Constructores de recursos HL7 FHIR R4
│   │   ├── fhir-client.js           # Cliente HTTP para interoperabilidad médica
│   │   ├── gcp-auth.js              # Autenticación con Google Cloud Healthcare
│   │   └── validators.js            # Validaciones de esquemas en backend
│   ├── auth/                        # Rutas de autenticación
│   │   ├── 2fa/                     # Controlador modular de 2FA
│   │   │   └── [action].js          # Endpoints de generación, verificación y login 2FA
│   │   ├── 2fa.js                   # Verificación general de 2FA
│   │   ├── logout.js                # Limpieza de cookies de sesión segura
│   │   └── session.js               # Emisión de cookies HttpOnly seguras
│   ├── auth.js                      # Diagnóstico de autenticación
│   ├── chat.js                      # Handler serverless para triaje con Gemini
│   ├── cron-notifications.js        # Disparador programado de notificaciones push
│   ├── fhir-get.js                  # Consulta de expedientes FHIR
│   ├── fhir.js                      # Ingesta y registro de recursos FHIR
│   ├── geocode.js                   # Proxy de geocodificación OpenStreetMap
│   └── health.js                    # Health check de la API
├── public/                          # Archivos estáticos y de la PWA
│   ├── app-logo-v1.jpg              # Logotipo oficial (Favicon, Branding, QR)
│   ├── app-logo-v2.jpg              # Variante de imagen de marca
│   ├── manifest.json                # Web App Manifest de la PWA
│   └── sw.js                        # Service Worker (Caché offline y Web Push)
├── src/                             # Código fuente de la aplicación React
│   ├── components/                  # Vistas y componentes de la interfaz de usuario
│   │   ├── admin/                   # Submódulos del Panel de Administración
│   │   │   ├── AnalyticsView.tsx           # Dashboard de métricas y rendimiento
│   │   │   ├── AnnouncementManagement.tsx  # CRUD y programación de anuncios
│   │   │   ├── HealthUnitManagement.tsx    # Gestión geográfica de centros de salud
│   │   │   ├── IAConfigView.tsx            # Selector dinámico del modelo de Gemini
│   │   │   ├── LocationManagement.tsx      # Gestión de distritos y zonas SILAIS
│   │   │   ├── SettingsManagement.tsx      # Modo mantenimiento y parámetros globales
│   │   │   └── UserManagement.tsx          # Control de usuarios y asignación de roles
│   │   ├── AdminView.tsx            # Contenedor general del panel administrativo
│   │   ├── AnnouncementModal.tsx    # Modal emergente de anuncios y alertas urgentes
│   │   ├── BuscarView.tsx           # Buscador de farmacias de turno e inventario
│   │   ├── CentrosView.tsx          # Mapa interactivo y directorio de unidades de salud
│   │   ├── ConsultaView.tsx         # Chat de triaje virtual con Salud-Conecta IA
│   │   ├── HomeView.tsx             # Pantalla principal (Dashboard y accesos rápidos)
│   │   ├── LoginView.tsx            # Formulario de inicio de sesión con soporte 2FA
│   │   ├── MedicalCategoryCarousel.tsx # Carrusel responsivo de especialidades médicas
│   │   ├── MfaChallengeModal.tsx    # Modal de verificación TOTP en inicio de sesión
│   │   ├── MfaEnrollmentModal.tsx   # Asistente de configuración y enrolamiento 2FA
│   │   ├── PerfilView.tsx           # Ficha médica, seguridad 2FA, exportación y datos
│   │   ├── PremiumView.tsx          # Módulo de funciones avanzadas y telemedicina
│   │   ├── RegisterView.tsx         # Registro de nuevos pacientes con validaciones
│   │   ├── Toast.tsx                # Notificaciones toast flotantes
│   │   ├── TwoFactorSetup.tsx       # Componente de configuración detallada de 2FA
│   │   └── TwoFactorVerify.tsx      # Pantalla de verificación de código de 6 dígitos
│   ├── contexts/                    # Contextos globales de React
│   │   ├── AuthContext.tsx          # Estado de sesión de Supabase, roles y perfil
│   │   └── LanguageContext.tsx      # Sistema de internacionalización (ES, EN, MI, KR)
│   ├── data/                        # Bases de conocimiento clínico y datos estáticos
│   │   ├── healthUnits/             # Coordenadas y fichas de unidades hospitalarias
│   │   ├── healthUnits.ts           # Listado de la red nacional de salud
│   │   ├── kriolTriageDatabase.ts   # Base de conocimiento de triaje en Criollo
│   │   ├── medicalData.ts           # Mocks y estructuras médicas iniciales
│   │   ├── miskitoTriageDatabase.ts # Base de conocimiento de triaje en Miskito
│   │   ├── simulatedMetrics.json    # Datos de simulación para métricas del sistema
│   │   └── triageDatabase.ts        # Reglas estándar de triaje clínico offline
│   ├── hooks/                       # Hooks personalizados
│   │   └── useGeolocation.ts        # Hook para lectura de GPS del dispositivo
│   ├── lib/                         # Servicios, SDKs y utilidades centrales
│   │   ├── validations/             # Esquemas de validación con Zod
│   │   │   ├── sanitize.ts          # Sanitización y limpieza de cadenas de entrada
│   │   │   ├── schemas.ts           # Esquemas Zod (2FA, Auth, Perfil, Chat)
│   │   │   └── validateMiddleware.ts# Middleware de validación de esquemas en Express
│   │   ├── authService.ts           # Operaciones de autenticación y sesión
│   │   ├── avatarService.ts         # Generador de avatares según perfil
│   │   ├── EmergencyQR.tsx          # Renderizador de la credencial médica QR
│   │   ├── fhirService.ts           # Serializador y parser HL7 FHIR R4
│   │   ├── kriolTriage.ts           # Algoritmo de triaje offline en Criollo
│   │   ├── mfaBackend.ts            # Generador TOTP y validación de tokens
│   │   ├── mfaService.ts            # Servicio cliente para configuración de 2FA
│   │   ├── miskitoTriage.ts         # Algoritmo de triaje offline en Miskito
│   │   ├── notificationService.ts   # Orquestador de suscripciones Web Push
│   │   ├── offlineTriage.ts         # Algoritmo de triaje offline general
│   │   ├── routeUtils.ts            # Cálculo de rutas y distancias hacia centros
│   │   ├── security.ts              # Reglas de protección y sanitización de datos
│   │   ├── sessionService.ts        # Manejo de cookies de sesión segura
│   │   ├── supabaseClient.ts        # Inicialización del cliente Supabase
│   │   ├── translations.ts          # Diccionario de traducciones (4 idiomas)
│   │   └── updateNotification.ts    # Gestor de notificaciones de versión de la PWA
│   ├── types/                       # Interfaces y tipos de TypeScript
│   │   └── index.ts                 # Modelos (UserProfile, Pharmacy, HealthCenter, etc.)
│   ├── App.tsx                      # Componente raíz y enrutador de vistas
│   ├── index.css                    # Estilos globales y capas de Tailwind CSS v4
│   ├── main.tsx                     # Punto de entrada de la aplicación
│   ├── theme.css                    # Variables CSS para modo claro y oscuro
│   └── vite-env.d.ts                # Tipos de entorno de Vite
├── .env.example                     # Plantilla de variables de entorno requeridas
├── .npmrc                           # Parámetros de compatibilidad para npm
├── index.html                       # Documento HTML principal
├── package.json                     # Declaración de dependencias y scripts
├── server.ts                        # Servidor local Express y middleware de Vite
├── tsconfig.json                    # Configuración estricta del compilador TypeScript
├── vercel.json                      # Reglas de ruteo y cabeceras para Vercel
└── vite.config.ts                   # Configuración del empaquetador Vite y plugins
```

---

## ⚖️ Marco Ético, Clínico y Seguridad de Datos

**Salud-Conecta IA** cumple con estrictos principios de bioética médica y protección de datos:

1. **Aviso Legal y Deslinde Médico Obligatorio:**  
   Toda respuesta generada por la IA o los motores offline incluye de manera inalterable la advertencia:  
   > *⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.*  
   La herramienta no prescribe medicamentos controlados ni sustituye el acto médico.

2. **Protocolo Inmediato de Emergencia:**  
   Ante la detección de signos de alarma de 🔴 **Alta urgencia** (como dolor torácico opresivo, dificultad respiratoria severa, pérdida de conciencia o hemorragias profusas), la interfaz bloquea flujos secundarios y despliega accesos directos a líneas de auxilio (**Cruz Roja 128** / **Emergencias 118**).

3. **Autenticación en Dos Pasos (2FA/MFA) Obligatoria para Roles Críticos:**  
   Los usuarios con rol de **Administrador**, **Superadministrador** o **Médico** requieren autenticación multifactor TOTP obligatoria para acceder a paneles de gestión o datos sensibles de pacientes.

4. **Validación y Sanitización Estricta (Zod):**  
   Todas las entradas de usuario en chat, formularios de autenticación y actualización de perfil son validadas con esquemas estrictos de **Zod** y sanitizadas contra ataques de *Cross-Site Scripting (XSS)* y *Prompt Injection*.

5. **Protección de Datos Sensibles (PII):**  
   Los datos clínicos del perfil se almacenan localmente con ofuscación en Base64 y viajan a través de canales HTTPS seguros protegidos por políticas CSP (*Content Security Policy*) y rate limiters por IP.

---

## 🛠️ Requisitos e Instalación

### Requisitos Previos
* **Node.js:** Versión `18.0.0` o superior (recomendado `20.x` o `22.x`).
* **NPM:** Gestor de paquetes oficial.

### Variables de Entorno (`.env`)

Copia la plantilla `.env.example` para crear tu archivo `.env` local:

```bash
cp .env.example .env
```

Configura las variables correspondientes:

```env
# ==========================================
# SUPABASE (Base de Datos, Auth y Realtime)
# ==========================================
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key_aqui

# ==========================================
# GOOGLE GEMINI AI
# ==========================================
GEMINI_API_KEY=tu_gemini_api_key_aqui

# ==========================================
# WEB PUSH (Notificaciones Push del Navegador)
# ==========================================
VITE_VAPID_PUBLIC_KEY=tu_vapid_public_key_aqui
VAPID_PRIVATE_KEY=tu_vapid_private_key_aqui
VAPID_SUBJECT=mailto:soporte@saludconecta.minsa.gob.ni

# ==========================================
# CONFIGURACIÓN DE RED Y SERVIDOR
# ==========================================
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CRON_SECRET=tu_clave_secreta_para_tareas_cron
```

---

## 💻 Scripts del Proyecto

| Script | Comando | Descripción |
| :--- | :--- | :--- |
| **`npm run dev`** | `tsx server.ts` | Inicia el servidor de desarrollo Express integrado con Vite HMR en `http://localhost:3000`. |
| **`npm run build`** | `vite build && esbuild server.ts ...` | Compila la aplicación frontend de React y genera el empaquetado del servidor en `dist/server.cjs`. |
| **`npm run start`** | `node dist/server.cjs` | Ejecuta el servidor compilado de producción. |
| **`npm run preview`** | `vite preview` | Previsualiza localmente el build estático generado por Vite. |
| **`npm run lint`** | `tsc --noEmit` | Ejecuta la verificación estática de tipos con el compilador de TypeScript. |
| **`npm run clean`** | `rm -rf dist server.js` | Limpia los directorios temporales y binarios de compilaciones previas. |

---

## 🚀 Despliegue y Puesta en Marcha Local

1. **Instalar dependencias del proyecto:**
   ```bash
   npm install --legacy-peer-deps
   ```
   *(Nota: Se emplea `--legacy-peer-deps` para garantizar compatibilidad entre librerías auxiliares y React 19).*

2. **Configurar el entorno:**
   Verifica que tu archivo `.env` contenga las credenciales válidas de Supabase y la API Key de Gemini.

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Acceder a la aplicación:**
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🧪 Identificadores de Pruebas de Calidad (E2E & QA)

Para facilitar la automatización de pruebas con Cypress, Playwright o Selenium, la aplicación incluye selectores estables:

* **Acceso de Invitado:** `#btn-login-guest`
* **Navegación Principal:** `#btn-nav-home`, `#btn-nav-consulta`, `#btn-nav-buscar`, `#btn-nav-centros`, `#btn-nav-perfil`
* **Botón de Instalación PWA:** `#btn-instalar`
* **Ajustes y Mantenimiento:** `#btn-settings`
* **Filas del Directorio de Farmacias:** `[data-testid="row-pharmacy-${id}"]` / `row-pharmacy-profile-${id}`
* **Acciones en Farmacias:** `btn-run-route-for-${id}`, `btn-whatsapp-for-${id}`
* **Flujo 2FA:** `#btn-setup-2fa`, `#btn-verify-totp`, `#input-totp-code`
* **Exportación de Ficha:** `#btn-export-pdf`, `#btn-export-fhir`

---

<div align="center">
  <small>Salud-Conecta IA © 2026. Diseñado para la salud comunitaria y accesibilidad médica en Nicaragua.</small>
</div>
