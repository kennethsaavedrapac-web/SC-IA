# Salud-Conecta IA (v1.2.1)

<div align="center">
  <img width="1200" height="475" alt="Banner Salud-Conecta IA" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

Bienvenido a **Salud-Conecta IA**, un asistente médico virtual y asesor de triaje clínico inteligente de vanguardia diseñado para operar de manera robusta y adaptada al contexto de Nicaragua. Esta plataforma híbrida unifica la potencia de los grandes modelos de lenguaje (con Google Gemini) con almacenamiento e infraestructura segura en tiempo real mediante Supabase, y capacidades de ejecución sin conexión (Offline) orientadas a comunidades vulnerables del Caribe nicaragüense.

---

## 🚀 Funciones de la Aplicación

La aplicación está diseñada para solventar barreras geográficas y lingüísticas en la atención primaria, ofreciendo una experiencia rica y reactiva tanto en ordenadores de escritorio como en dispositivos móviles (como una PWA completa).

### 1. Triaje Virtual Inteligente (IA)
* **Evaluación de Síntomas en Tiempo Real:** El núcleo clínico interactúa mediante un chat conversacional inteligente impulsado por Google Gemini. Los usuarios ingresan sus malestares y la IA clasifica el caso en tres prioridades principales utilizando emojis normalizados:
  * 🔴 **Alta urgencia**
  * 🟡 **Moderado**
  * 🟢 **Leve**
* **Contextualización Geográfica y Temporal:** La IA tiene conocimiento absoluto del ecosistema nicaragüense (Nicaragua y regiones como Granada). Evalúa dinámicamente el día y la hora de la consulta:
  * *Regla Estricta:* Si la consulta se realiza fuera de la jornada del MINSA (Lunes a Viernes, 08:00 AM a 04:00 PM), la IA reprime derivaciones a centros de salud locales (cerrados) y redirige de forma segura a hospitales públicos de referencia 24/7.
* **Integración del Perfil del Paciente:** Si el usuario tiene registradas afecciones médicas crónicas, alergias o tipo de sangre en su perfil, estos se envían sanitizados como contexto clínico confidencial a la IA para una evaluación de riesgos personalizada.

### 2. Triajes Especializados e Interculturales (Offline)
Pensando en la diversidad de la Costa Caribe nicaragüense, donde la conectividad a Internet suele verse interrumpida, la aplicación dispone de motores de triaje preprogramados y bases de conocimiento clínico locales cargadas en la memoria del navegador.
* **Triaje Multilingüe:**
  * **Miskito (Miskitu):** Triaje con bases de conocimiento e interfaz localizada en lengua Miskita.
  * **Kriol (Caribeño):** Triaje configurado en inglés criollo nicaragüense.
* **Funcionamiento 100% Offline:** Utiliza una base de datos estática e indexada que analiza combinaciones clave de síntomas y signos vitales reportados para arrojar una evaluación de gravedad inmediata sin requerir red.

### 3. Búsqueda y Navegación de Centros de Salud
* **Buscador de Unidades de Salud:** Permite filtrar y localizar hospitales públicos, centros de salud comunitarios y clínicas privadas.
* **Directorio de Farmacias de Turno:** Lista completa de establecimientos farmacéuticos activos en la región.
* **Layout Responsivo y Especializado en Farmacias:** Cada tarjeta de farmacia utiliza una altura mínima de `280px` (`min-h-[280px]`) para apilar ordenadamente insignias de estado y botones de acción verticalmente en pantallas móviles.
* **Acciones Directas:**
  * **Ver Ruta (Google Maps / OpenStreetMap):** Genera rutas óptimas de asistencia.
  * **Botón de WhatsApp:** Redirección directa para consultas rápidas con la farmacia seleccionada (requiere la propiedad obligatoria `phone` en la interfaz).

### 4. Tarjeta de Emergencia QR (Ficha Médica Portable)
* **Generación de QR Dinámico:** A través de la biblioteca `qrcode.react`, se consolida la información vital del paciente (tipo de sangre, contactos de emergencia, alergias, condiciones) en un código QR cifrado o estructurado para uso de paramédicos y socorristas.
* **Branding Unificado:** Incorpora el logotipo oficial de la app (`public/app-logo-v1.jpg`) en el centro del código QR para un acabado profesional y de marca unificada.
* **Descarga en PDF:** El usuario puede exportar su ficha médica formateada en alta calidad mediante `jspdf`.

### 5. Panel de Administración Avanzado
* **Mantenimiento Global:** Activa el "Modo Mantenimiento", bloqueando el acceso a usuarios no administradores mediante pantallas descriptivas del MINSA.
* **Gestor de Anuncios (Banner de Anuncios Activos):** Los administradores pueden programar anuncios con rango de fechas y niveles de criticidad (informativos o alerta). Estos se sincronizan en tiempo real mediante Supabase PostgreSQL Channels y persisten su estado de descarte por el usuario en `localStorage`.
* **Configuración Dinámica de IA:** Permite alternar en caliente el modelo de Gemini utilizado en producción (por ejemplo, de `gemini-2.5-flash-lite` a otros modelos superiores) desde la interfaz de administración.
* **Gestión de Unidades de Salud y Usuarios:** CRUD completo para gestionar la base de datos geográfica y de cuentas de usuario.

### 6. Sistema de Notificaciones de Actualización (PWA)
* **Toast & Bottom Sheet Adaptativos:** La aplicación implementa notificaciones inteligentes al detectar una nueva versión compilada en el Service Worker.
  * En **Móviles / Tablets**, se proyecta una hoja de ruta inferior interactiva (*Bottom Sheet*).
  * En **Ordenadores de Escritorio (Desktop)**, se muestra un Toast compacto elegante.
* **Supresión por 24 Horas:** Si el usuario pospone la actualización, el sistema almacena `updateNotificationDismissedAt` en `localStorage` para evitar interrumpir de nuevo su flujo de trabajo en las próximas 24 horas, a menos que realice una comprobación manual desde la configuración.

---

## 🏛️ Arquitectura de la Aplicación

La aplicación sigue una arquitectura moderna de **SPA (Single Page Application)** unida a un Backend híbrido de **Funciones Serverless (Edge API)** y un servidor intermedio para desarrollo local.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Vite + React 19)                 │
│                                                                        │
│   ┌────────────────────┐   ┌────────────────────┐   ┌──────────────┐   │
│   │   i18n & Contexts  │   │  Servicios Locales │   │  PWA / Cache │   │
│   │ (Language/Auth/Theme)│ │ (Offline Triage/QR)│   │ (sw.js /     │   │
│   └─────────┬──────────┘   └─────────┬──────────┘   │ manifest.json)   │
└─────────────┼────────────────────────┼──────────────┴──────┬───────┴───┘
              │                        │                     │
              ▼                        ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       CAPA DE DATOS Y SERVICIOS                        │
│                                                                        │
│   ┌────────────────────────────────┐   ┌───────────────────────────┐   │
│   │    Servidor Node.js / Express  │   │     Supabase Platform     │   │
│   │       (Vite Dev Middleware)    │   │                           │   │
│   │   • Servidor local (Port 3000) │   │   • PostgreSQL & Realtime │   │
│   │   • Control de tasas de API    │   │   • Autenticación (JWT)   │   │
│   │   • Proxies de triaje Gemini   │   │   • Almacenamiento seguro │   │
│   └───────────────┬────────────────┘   └───────────────────────────┘   │
└───────────────────┼────────────────────────────────────────────────────┘
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       PROVEEDORES EXTERNOS                             │
│                                                                        │
│   ┌────────────────────────────────┐   ┌───────────────────────────┐   │
│   │    Google Gemini AI (LLM)      │   │     Web Push (Notif.)     │   │
│   └────────────────────────────────┘   └───────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Componentes de la Arquitectura
1. **Frontend (Vite + React 19 + Tailwind CSS v4):** Interfaz fluida, declarativa e hiper-responsiva que hace uso exhaustivo de la biblioteca de animaciones `motion` (Framer Motion) y el paquete de iconos unificado `lucide-react`.
2. **Backend (Vercel Serverless Functions / Express Server):**
   * El archivo de entrada de producción local es `server.ts` que expone los endpoints en el puerto `3000`.
   * Hace uso de middleware de seguridad restrictivos (`helmet` con CSP rígido, `cors` restrictivo, y `express-rate-limit` para frenar ataques de denegación de servicio a las cuotas de Gemini).
   * En producción bajo Vercel, se ejecutan las funciones serverless modulares alojadas en la carpeta `api/`.
3. **Persistencia e Integración de Datos (Supabase):**
   * **Base de datos relacional:** Tablas para usuarios, perfiles médicos, centros de salud, farmacias, anuncios de administración, registros de logs e historial de triajes.
   * **Realtime Engine:** Empleo de WebSockets seguros mediante Supabase Channels para reaccionar al instante a los cambios de configuración del administrador (anuncios y modo de mantenimiento) sin recargar la app.
4. **Capas PWA (Progressive Web App):**
   * Un Service Worker dedicado (`public/sw.js`) gestiona el almacenamiento en caché de los activos estáticos principales.
   * La sincronización de caché se gestiona mediante control de versiones de cadena de consulta (por ejemplo, `manifest.json?v=8`) declarado simultáneamente en `index.html` y la lista de precaché `ASSETS_TO_CACHE` del Service Worker.
   * Captura el evento `beforeinstallprompt` para guiar al usuario mediante un banner personalizado (con soporte especial para iOS mediante tutoriales nativos).

---

## 📂 Estructura del Directorio (Modular)

La estructura del código fuente está altamente organizada de acuerdo a responsabilidades de dominio bien definidas:

```
salud-conecta-ia/
├── api/                             # Funciones Serverless de Backend para Vercel
│   ├── _lib/                        # Librerías internas y utilidades de backend
│   ├── chat.js                      # Handler para la consulta médica de IA
│   ├── cron-notifications.js        # Envío programado de alertas push
│   ├── fhir-get.js                  # Consultas de expedientes bajo estándar FHIR
│   ├── fhir.js                      # Escritura de expedientes bajo estándar FHIR
│   ├── geocode.js                   # Proxy de geocodificación de direcciones
│   └── health.js                    # Diagnóstico de estado del backend
├── public/                          # Recursos estáticos globales públicos
│   ├── app-logo-v1.jpg              # Logotipo oficial (Branding, favicon, QR central)
│   ├── app-logo-v2.jpg              # Variaciones de imagen de marca
│   ├── manifest.json                # Configuración de PWA e iconos de instalación
│   └── sw.js                        # Service Worker de la aplicación (Caché & Notificaciones)
├── src/                             # Código fuente de la aplicación React
│   ├── components/                  # Componentes de UI modulares y vistas principales
│   │   ├── admin/                   # Submódulos del panel de administración
│   │   │   ├── AnalyticsView.tsx           # Gráficos y logs de uso de la app
│   │   │   ├── AnnouncementManagement.tsx  # CRUD de anuncios dinámicos
│   │   │   ├── HealthUnitManagement.tsx    # CRUD de centros de salud y geolocalización
│   │   │   ├── IAConfigView.tsx            # Modificación de variables de Gemini en caliente
│   │   │   ├── LocationManagement.tsx      # Gestión de distritos y zonas de cobertura
│   │   │   ├── SettingsManagement.tsx      # Modos globales de la app (mantenimiento, etc.)
│   │   │   └── UserManagement.tsx          # Control de roles y perfiles
│   │   ├── AdminView.tsx            # Contenedor del panel administrativo superior
│   │   ├── AnnouncementModal.tsx    # Modal de avisos urgentes en tiempo real
│   │   ├── BuscarView.tsx           # Buscador de farmacias de turno e indicador min-h
│   │   ├── CentrosView.tsx          # Mapa interactivo y listado de unidades médicas
│   │   ├── ConsultaView.tsx         # Vista de interacción de chat con Salud-Conecta IA
│   │   ├── HomeView.tsx             # Pantalla de bienvenida principal (Dashboard)
│   │   ├── LoginView.tsx            # Autenticación de usuarios regulares y gestores
│   │   ├── MedicalCategoryCarousel.tsx # Carrusel responsivo de categorías de salud
│   │   ├── PerfilView.tsx           # Configuración del perfil médico y diseño en grid
│   │   ├── PremiumView.tsx          # Gestión de funcionalidades premium y pasarela simulada
│   │   ├── RegisterView.tsx         # Formulario de alta para pacientes nuevos
│   │   └── Toast.tsx                # Notificaciones dinámicas flotantes
│   ├── contexts/                    # Proveedores de estado global (Context API)
│   │   ├── AuthContext.tsx          # Estado de sesión de Supabase y roles
│   │   └── LanguageContext.tsx      # Multiidioma (es, en, mi, kr) e inyección de textos
│   ├── data/                        # Datos estáticos, bases de conocimiento y mocks
│   │   ├── healthUnits/             # Coordinadas geográficas de los centros de salud
│   │   ├── healthUnits.ts           # Definiciones de red hospitalaria nicaragüense
│   │   ├── kriolTriageDatabase.ts   # Base de conocimiento estática para triaje Kriol
│   │   ├── medicalData.ts           # Perfil predeterminado e inicializaciones
│   │   ├── miskitoTriageDatabase.ts # Base de conocimiento estática para triaje Miskito
│   │   └── triageDatabase.ts        # Reglas estándar de triaje de contingencia
│   ├── hooks/                       # React Hooks reutilizables
│   │   └── useGeolocation.ts        # Sensor de geolocalización del dispositivo
│   ├── lib/                         # Clientes SDK y algoritmos centrales
│   │   ├── authService.ts           # Funciones de lógica de negocio de autenticación
│   │   ├── avatarService.ts         # Generador e integrador de avatares del perfil
│   │   ├── EmergencyQR.tsx          # Renderizador del QR con logo de marca insertado
│   │   ├── fhirService.ts           # Serializador y conector bajo el estándar HL7 FHIR
│   │   ├── kriolTriage.ts           # Motor del triaje sin conexión en Criollo
│   │   ├── miskitoTriage.ts         # Motor del triaje sin conexión en Miskito
│   │   ├── notificationService.ts   # Orquestador del Service Worker para notificaciones push
│   │   ├── offlineTriage.ts         # Motor del triaje sin conexión general
│   │   ├── routeUtils.ts            # Calculador de distancias y rutas seguras de evacuación
│   │   ├── supabaseClient.ts        # Inicialización del cliente de base de datos Supabase
│   │   ├── translations.ts          # Diccionario unificado para la app en v1.2.1
│   │   └── updateNotification.ts    # Inyección de estilos y renderizado toast/bottom sheet
│   ├── types/                       # Definiciones de Tipos de TypeScript
│   │   └── index.ts                 # Interfaces de dominio (UserProfile, Pharmacy, etc.)
│   ├── App.tsx                      # Componente raíz orquestador de vistas y PWA banners
│   ├── index.css                    # Estilos globales y capas de Tailwind
│   ├── main.tsx                     # Punto de entrada de renderizado de React
│   ├── theme.css                    # Variables CSS de paleta de colores oscuros/claros
│   └── vite-env.d.ts                # Tipados para importaciones de Vite
├── .env.example                     # Plantilla de variables de entorno del proyecto
├── .npmrc                           # Configuración NPM (ej. legacy-peer-deps para React 19)
├── index.html                       # HTML5 esqueleto principal
├── server.ts                        # Servidor local de desarrollo y producción Express
├── tsconfig.json                    # Reglas de compilación y tipado estricto TypeScript
├── vercel.json                      # Configuración de ruteo e infraestructura en Vercel
└── vite.config.ts                   # Orquestador de empaquetado de Vite y Plugins React
```

---

## ⚖️ Estructura Moral y Ética Médica

**Salud-Conecta IA** opera bajo una estricta filosofía de **ética médica, protección al usuario y responsabilidad social**, fundamentada en las siguientes directrices operativas y de software:

### 1. Deslinde de Responsabilidad Médica Obligatoria (Disclaimer)
Todas las evaluaciones generadas por la IA o los sistemas offline adjuntan obligatoriamente la advertencia estándar:
> *"⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud."*
La plataforma nunca emite recetas de medicamentos controlados ni asegura un diagnóstico médico definitivo. Su rol es puramente el de un **clasificador y derivador del nivel de prioridad clínica**.

### 2. Protocolo de Emergencia Real
Cuando el triaje clasifica el caso en 🔴 **Alta urgencia**, la interfaz bloquea acciones secundarias y prioriza:
* El despliegue visual inmediato de una alerta de color carmín con indicaciones sencillas de primeros auxilios.
* Un enlace de llamada directa a la **Cruz Roja Nicaragüense (128)** o servicios del MINSA.
* Consejos claros contra la automedicación en situaciones críticas.

### 3. Privacidad Absoluta de Datos Sensibles (PII)
* **Cifrado Ligero en LocalStorage:** La información médica crítica del usuario (como condiciones clínicas y alergias) se almacena en el navegador utilizando codificación en Base64 para evitar la exposición directa en texto plano en el dispositivo.
* **Flujo Seguro en APIs:** El perfil del paciente se somete a procesos de sanitización estrictos (expresiones regulares) para evitar inyecciones de código maliciosas (*Prompt Injection*) antes de interactuar con las APIs de Gemini.

### 4. Lenguaje Empático, Científico y No Alarmista
Las respuestas de la IA están restringidas bajo directivas de sistema (*System Instructions*) para mantener un tono empático, tranquilizador, profesional y culturalmente adaptado al usuario nicaragüense, evitando a toda costa la generación de pánico o ansiedad innecesaria en el paciente.

---

## 🛠️ Dependencias y Variables de Entorno

### Requisitos del Sistema
* **Node.js:** v18.0.0 o superior recomendado.
* **NPM / Bun:** Para la gestión de paquetes.

### Dependencias Principales (`package.json`)
* **`react` & `react-dom` (v19.2.7):** Motor de interfaz UI.
* **`@google/generative-ai` (v0.24.1):** SDK oficial para conectar con la API de Gemini.
* **`@supabase/supabase-js` (v2.106.2):** Cliente para persistencia de datos y sincronización en tiempo real.
* **`express` (v4.21.2) & `cors` / `helmet`:** Infraestructura de servidor y directivas de seguridad.
* **`jspdf` (v4.2.1):** Generador de PDF en lado del cliente para exportar la ficha médica QR.
* **`qrcode.react` (v3.1.0):** Generador del código QR de emergencia.
* **`motion` (v12.23.24):** Framework de transiciones fluidas.
* **`lucide-react` (v0.546.0):** Catálogo de iconos vectoriales integrados.

---

### Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto a partir de `.env.example` y rellena las siguientes variables:

```bash
# --- SUPABASE (Plataforma e Infraestructura) ---
# URL de la API REST de tu proyecto Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
# Clave pública anónima de acceso seguro para el cliente frontend
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui

# --- GEMINI AI (Inteligencia Artificial) ---
# API Key generada en Google AI Studio
GEMINI_API_KEY=tu_gemini_api_key_aqui

# --- WEB PUSH (Notificaciones Push del Navegador) ---
# Clave pública VAPID para registro en el navegador
VITE_VAPID_PUBLIC_KEY=tu_vapid_public_key_aqui
# Clave privada VAPID para firma en el servidor (Mantener secreta)
VAPID_PRIVATE_KEY=tu_vapid_private_key_aqui
# Email de contacto para reportes de suscripción de notificaciones
VAPID_SUBJECT=mailto:tu-email@ejemplo.com

# --- CONFIGURACIÓN DE RED ---
# URL del cliente web (CORS)
FRONTEND_URL=http://localhost:3000

# --- SEGURIDAD ---
# Secreto para invocar tareas cron (notificaciones masivas automáticas)
CRON_SECRET=tu_cron_secret_aqui

# --- GOOGLE MAPS (Geocodificación y Mapas) ---
# Clave de API de Google Maps JavaScript API
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key_aqui

# --- ENTORNO ---
# Define el modo de ejecución (development o production)
NODE_ENV=development
```

---

## 💻 Scripts del Proyecto

Puedes ejecutar las siguientes tareas desde la consola en la carpeta raíz:

| Script | Comando | Descripción |
| :--- | :--- | :--- |
| **`npm run dev`** | `tsx server.ts` | Inicia el servidor de desarrollo local de Express con recarga en caliente para el Frontend de Vite. Puerto por defecto: `3000`. |
| **`npm run build`** | `vite build && esbuild server.ts ...` | Compila la aplicación de React optimizada para producción y empaqueta el servidor de Node en `dist/server.cjs`. |
| **`npm run start`** | `node dist/server.cjs` | Ejecuta el servidor optimizado de producción desde el empaquetado distribuido en `dist/`. |
| **`npm run preview`** | `vite preview` | Previsualiza localmente el empaquetado estático generado por Vite. |
| **`npm run lint`** | `tsc --noEmit` | Ejecuta el análisis estático del compilador de TypeScript para validar tipos y buscar fallas potenciales. |
| **`npm run clean`** | `rm -rf dist server.js` | Limpia los directorios temporales de compilación y empaquetados anteriores. |

---

## ⚙️ Configuración y Despliegue Local

1. **Instalar dependencias:**
   ```bash
   npm install --legacy-peer-deps
   ```
   *(Nota: Se emplea `--legacy-peer-deps` debido a la coexistencia de librerías como `qrcode.react` con la versión de React 19).*

2. **Configurar el entorno:**
   Copia el archivo modelo de configuración:
   ```bash
   cp .env.example .env
   ```
   Introduce las llaves correspondientes explicadas en el apartado anterior.

3. **Ejecutar el Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación funcionando con recarga en caliente instantánea.

---

### 🛡️ Cumplimiento de Pruebas de Calidad (Automated Testing)
Para mantener la integridad ante futuras actualizaciones, la aplicación utiliza identificadores estáticos de prueba (`id` o atributos) para componentes clave, por ejemplo:
* **Acceso de Invitados:** `#btn-login-guest`
* **Botones de Navegación Móvil:** `#btn-nav-[vista]` (p. ej., `#btn-nav-home`, `#btn-nav-consulta`)
* **Botón de Instalación PWA:** `#btn-instalar`
* **Filas del Directorio:** `row-pharmacy-profile-${id}`
* **Botones de Acción en Farmacias:** `btn-run-route-for-${id}` y `btn-whatsapp-for-${id}`
* **Secciones Desplegables de Configuración:** `btn-profile-menu-[id]`
* **Botón de Ajustes del Sistema:** `id="btn-settings"`
