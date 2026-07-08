<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Salud Conecta IA

**Salud Conecta IA** es una plataforma digital de salud orientada a la población de Nicaragua que combina Inteligencia Actoral y estándares internacionales de interoperabilidad médica para ofrecer un sistema inteligente y adaptativo de triaje clínico, geolocalización de recursos de salud, y almacenamiento estructurado de registros médicos.

---

## 1. Descripción del Proyecto

La aplicación resuelve la fragmentación y la falta de inmediatez en el acceso a la orientación médica preliminar en comunidades locales. Su enfoque tecnológico principal se basa en:
*   **Asistencia y Triaje Clínico:** Un chat inteligente potenciado por **Google Gemini AI** que evalúa síntomas del paciente de forma contextualizada. La IA está programada para considerar la geografía nicaragüense, los perfiles de salud preexistentes del usuario y factores temporales cruciales (por ejemplo, si los centros de salud locales del MINSA están abiertos en el horario laboral actual o si se debe derivar exclusivamente a hospitales 24/7).
*   **Localización y Mapeo de Recursos:** Un mapa interactivo híbrido (**Google Maps JS SDK** con fallback a **Leaflet**) que geolocaliza hospitales, clínicas, farmacias y médicos, permitiendo filtrados inteligentes por categoría.
*   **Interoperabilidad en Salud:** Integración con la **API de Google Cloud Healthcare** para almacenar y recuperar la información clínica estructurada bajo el estándar global **FHIR R4** (Fast Healthcare Interoperability Resources).
*   **Capacidades PWA:** Soporte completo de Service Worker para funcionamiento sin conexión, almacenamiento de datos locales con Supabase/LocalStorage y notificaciones Push pushManager.

---

## 2. Arquitectura del Sistema

El sistema implementa una **Arquitectura Híbrida Desacoplada** optimizada para despliegues Serverless y escalabilidad horizontal:

```mermaid
graph TD
    Client[Cliente: React PWA] -->|HTTP / JSON| ExpressServer[Express Local Server.ts]
    Client -->|HTTP / JSON| VercelAPI[Vercel Serverless Functions api/*.js]
    ExpressServer -->|Proxy / Enrutamiento| VercelAPI
    
    VercelAPI -->|Gemini SDK| GeminiAPI[Google Gemini AI]
    VercelAPI -->|FHIR R4 Protocol| GCPHealthcare[Google Cloud Healthcare API]
    VercelAPI -->|PostgREST| Supabase[Supabase DB / Auth]
    
    Client -->|Fallback Leaflet / Direct SDK| GoogleMaps[Google Maps / OpenStreetMap]
```

### Componentes de la Arquitectura
*   **Frontend (Capa de Presentación):** Desarrollado en **React 19 + TypeScript + Vite**. Aplica un diseño responsivo móvil-primero con micro-animaciones en Framer Motion y TailwindCSS. Interactúa con el backend consumiendo endpoints JSON y maneja mapas en capas dinámicas encapsuladas dentro de iframes para aislar el contexto de ejecución.
*   **Backend (Servidor y API):**
    *   **Entorno Local:** Un servidor unificado en **Express** (`server.ts`) que orquesta la carga de middleware de seguridad (Helmet, CORS con restricciones de dominio, Rate Limiters por IP) y sirve el empaquetado del frontend al igual que las rutas de la API de forma integrada.
    *   **Entorno de Producción (Serverless):** Funciones sin servidor en **Vercel** (`api/*.js`) optimizadas para ejecución asíncrona rápida, aislando las consultas a la base de datos, la interacción con la IA y la encriptación/autenticación OAuth2 de GCP.
*   **Capa de Servicios y Negocio (`api/_lib`):**
    *   **FHIR Client:** Encapsula la lógica de comunicación REST con el almacén FHIR en la nube de Google, administrando tokens de Service Account temporales firmados por JWT de forma segura en el servidor.
    *   **FHIR Builders:** Factory pattern que toma las estructuras del frontend y las mapea a recursos estándar FHIR R4 tales como `Patient`, `Observation`, `Encounter`, `AllergyIntolerance`, y `MedicationStatement`.
    *   **Validators:** Middleware de sanitización de entradas, filtrando scripts maliciosos (XSS) y formateando documentos oficiales (como la Cédula de Identidad de Nicaragua).

---

## 3. Estructura Modular del Proyecto

La estructura de directorios sigue un diseño modular claro que separa la lógica del cliente de la API del servidor:

```text
SC-IA-1/
├── .agents/                    # Reglas internas del agente y configuraciones locales
├── api/                        # Funciones Serverless de Backend (Compatibilidad con Vercel)
│   ├── _lib/                   # Módulos de soporte técnico del servidor (Core de Integración)
│   │   ├── fhir-builders.js    # Transformadores de datos JSON al estándar FHIR R4
│   │   ├── fhir-client.js      # Conector REST directo a Google Cloud Healthcare
│   │   ├── gcp-auth.js         # Generador de Tokens OAuth2 de GCP usando JWT y llaves PEM
│   │   └── validators.js       # Validadores de datos médicos y prevención de XSS
│   ├── chat.js                 # Handler para triaje virtual con Gemini AI
│   ├── cron-notifications.js   # Tarea programada para envío masivo de notificaciones Push
│   ├── fhir-get.js             # Endpoint para leer registros FHIR del paciente
│   ├── fhir.js                 # Endpoint para escribir/actualizar registros FHIR del paciente
│   ├── geocode.js              # Proxy para geocodificación reversa usando OpenStreetMap
│   └── health.js               # Endpoint de monitoreo de estado del sistema (Healthcheck)
├── public/                     # Archivos estáticos y manifiesto PWA
│   ├── sw.js                   # Service Worker para almacenamiento en caché y notificaciones Push
│   └── manifest.json           # Configuración de Progressive Web App
├── src/                        # Código Fuente de la Aplicación Frontend (React)
│   ├── components/             # Componentes UI (Vistas de Chat, Mapas de Centros, etc.)
│   ├── contexts/               # Proveedores de Contexto global (Idioma, Temas de Interfaz)
│   ├── data/                   # Archivos de datos locales y catálogos estáticos
│   ├── hooks/                  # Custom Hooks reutilizables (Geolocalización, Toasts)
│   ├── lib/                    # Clientes de servicios externos y utilidades
│   │   ├── supabaseClient.ts   # Conector inicial a base de datos Supabase
│   │   ├── notificationService.ts # Gestor de notificaciones Push y permisos
│   │   └── translations.ts     # Diccionarios de internacionalización (ES / EN)
│   ├── types/                  # Tipados estrictos de TypeScript del frontend
│   ├── App.tsx                 # Enrutador principal y punto central del estado del cliente
│   ├── index.css               # Estilos globales y variables TailwindCSS
│   └── main.tsx                # Inicializador de React y renderizado de DOM
├── server.ts                   # Servidor de desarrollo local Express
├── tsconfig.json               # Configuración del compilador de TypeScript
├── vite.config.ts              # Configuración de compilación y empaquetado de Vite
├── package.json                # Dependencias, metadatos y scripts npm
└── README.md                   # Documentación técnica del proyecto
```

---

## 4. Requisitos Previos y Dependencias

### Requisitos Nucleares
*   **Node.js:** Versión `v18.0.0` o superior (se recomienda `v20.x.x` LTS).
*   **npm:** Versión `v9.0.0` o superior.
*   **Cuentas de Servicios Requeridas:**
    *   Proyecto en **Google Cloud Platform** con la API Healthcare habilitada y un almacén FHIR R4 configurado.
    *   Clave de desarrollador para la API de **Google Gemini** (Google AI Studio).
    *   Proyecto activo en **Supabase** (Base de datos PostgreSQL y autenticación).

### Dependencias Principales

| Categoría | Dependencia | Propósito |
| :--- | :--- | :--- |
| **Producción** | `@google/generative-ai` | Integración y comunicación con la API de IA Gemini. |
| **Producción** | `@supabase/supabase-js` | Cliente e interactividad con la base de datos y autenticación de Supabase. |
| **Producción** | `express` | Servidor HTTP para la orquestación y desarrollo local. |
| **Producción** | `web-push` | Firmado y transmisión segura de notificaciones Push a navegadores clientes. |
| **Producción** | `react` & `react-dom` | Renderizado declarativo de componentes del frontend. |
| **Producción** | `motion` | Animaciones de interfaz fluidas y dinámicas para el usuario. |
| **Desarrollo** | `vite` | Entorno de ejecución rápido para el frontend y servidor HMR. |
| **Desarrollo** | `esbuild` | Empaquetador de alta velocidad para compilar TypeScript del backend local. |
| **Desarrollo** | `tsx` | Ejecución directa de archivos TypeScript en Node.js sin paso previo de build. |
| **Desarrollo** | `typescript` | Verificación estática de tipos para asegurar robustez en el código. |

---

## 5. Variables de Entorno

Para ejecutar la aplicación es indispensable contar con un archivo `.env` en la raíz del proyecto. 

### Archivo de Ejemplo (`.env.example`)
```env
# --- SUPABASE ---
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu_clave_anonima_publica"

# --- GEMINI AI ---
GEMINI_API_KEY="tu_gemini_api_key"

# --- WEB PUSH ---
VITE_VAPID_PUBLIC_KEY="tu_vapid_public_key"
VAPID_PRIVATE_KEY="tu_vapid_private_key"
VAPID_SUBJECT="mailto:tu-correo@ejemplo.com"

# --- FRONTEND (CORS) ---
FRONTEND_URL="http://localhost:3000"

# --- GOOGLE MAPS ---
VITE_GOOGLE_MAPS_API_KEY="tu_google_maps_api_key"
VITE_GOOGLE_MAPS_MAP_ID="tu_custom_map_id"

# --- GCP HEALTHCARE API (FHIR R4 STORE) ---
GCP_PROJECT_ID="nombre-del-proyecto-gcp"
GCP_HEALTHCARE_LOCATION="us-central1"
GCP_HEALTHCARE_DATASET="nombre-dataset-healthcare"
GCP_HEALTHCARE_FHIR_STORE="nombre-fhir-store"
GCP_SERVICE_ACCOUNT_EMAIL="servicio-conexion@nombre-del-proyecto.iam.gserviceaccount.com"
GCP_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Tabla Descriptiva de Configuración

| Variable | Descripción | Valor por Defecto | Requerido |
| :--- | :--- | :--- | :---: |
| `VITE_SUPABASE_URL` | URL de la API del proyecto de Supabase. | *Ninguno* | **Sí** |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima pública del cliente Supabase. | *Ninguno* | **Sí** |
| `GEMINI_API_KEY` | Token de acceso a la API de Google Gemini. | *Simulación offline* | **No** |
| `VITE_VAPID_PUBLIC_KEY` | Clave VAPID pública para notificaciones Push web. | *Ninguno* | **Sí** |
| `VAPID_PRIVATE_KEY` | Clave VAPID privada para firmas del lado del servidor. | *Ninguno* | **Sí** |
| `VAPID_SUBJECT` | URI de contacto VAPID (mailto:). | *Ninguno* | **Sí** |
| `FRONTEND_URL` | Origen de CORS permitido (producción). | `http://localhost:3000` | **No** |
| `VITE_GOOGLE_MAPS_API_KEY` | Key de la plataforma de Google Maps. | *Fallback Leaflet* | **No** |
| `VITE_GOOGLE_MAPS_MAP_ID` | Map ID para habilitar Advanced Markers. | `DEMO_MAP_ID` | **No** |
| `GCP_PROJECT_ID` | ID único del proyecto de Google Cloud. | *Ninguno* | **Sí** |
| `GCP_HEALTHCARE_LOCATION` | Zona GCP de la base de datos de Healthcare. | `us-central1` | **No** |
| `GCP_HEALTHCARE_DATASET` | Nombre del Dataset médico en GCP. | *Ninguno* | **Sí** |
| `GCP_HEALTHCARE_FHIR_STORE`| Nombre del almacén FHIR R4 en el Dataset. | *Ninguno* | **Sí** |
| `GCP_SERVICE_ACCOUNT_EMAIL`| Correo de la Service Account con rol de Healthcare Admin. | *Ninguno* | **Sí** |
| `GCP_SERVICE_ACCOUNT_PRIVATE_KEY`| Llave privada PEM de la cuenta de servicio de GCP. | *Ninguno* | **Sí** |

---

## 6. Scripts Disponibles

El proyecto provee los siguientes scripts configurados en el `package.json` para gestionar el ciclo de vida del desarrollo y despliegue:

```bash
# Instalar todas las dependencias necesarias
npm install

# Iniciar la aplicación en modo de desarrollo local (Express + Vite HMR)
npm run dev

# Ejecutar el análisis estático y verificación de tipos (TypeScript compiler)
npm run lint

# Generar el compilado optimizado de producción para cliente y servidor local
npm run build

# Limpiar los directorios de compilado generados
npm run clean

# Arrancar el servidor Express local utilizando el compilado de producción
npm run start
```

---

## 7. Documentación de la API (Endpoints)

La comunicación cliente-servidor se realiza a través de las siguientes rutas de API.

### `POST /api/chat`
Envía la consulta clínica del usuario junto con el historial reciente y perfil para clasificar la urgencia y retornar el triaje médico guiado por IA.

*   **Estructura del Body (JSON):**
    ```json
    {
      "message": "Tengo un dolor muy fuerte en el pecho que se me extiende al brazo izquierdo y sudoración fría.",
      "history": [
        {
          "sender": "user",
          "text": "Hola, me siento un poco mal."
        }
      ],
      "userProfile": {
        "id": "87e3eb86-9c26-4aa6-ae0c-2fdd5164a97a",
        "name": "Pedro García",
        "city": "Granada",
        "healthConditions": ["Hipertensión"]
      }
    }
    ```

*   **Ejemplo de Respuesta Exitosa (`200 OK`):**
    ```json
    {
      "text": "Nivel de prioridad: 🔴 Alta urgencia\n\n🔍 EVALUACIÓN INICIAL\nLos síntomas descritos corresponden a un potencial síndrome coronario agudo (infarto agudo de miocardio). Dado el antecedente de hipertensión, este cuadro requiere evaluación clínica inmediata y especializada.\n\n✅ RECOMENDACIONES\n🔹 Llame de inmediato al número de emergencias 118 o busque traslado inmediato al hospital más cercano.\n🔹 Reposo absoluto en posición semisentada; no realice esfuerzos físicos.\n🔹 Si cuenta con tratamiento de aspirina indicado previamente por su cardiólogo y no es alérgico, mastique una tableta.\n🔹 Manténgase acompañado en todo momento.\n\n⚠️ Esta orientación es únicamente informativa y no reemplaza la evaluación de un profesional de salud.",
      "simulated": false
    }
    ```

---

### `POST /api/fhir`
Toma el formulario de historial médico del usuario en el frontend y lo mapea hacia múltiples recursos enlazados atómicamente dentro de un Transaction Bundle en la API de Google Cloud Healthcare.

*   **Estructura del Body (JSON):**
    ```json
    {
      "medicalData": {
        "cedula": "001-150590-0002B",
        "enfermedades": "Hipertensión arterial",
        "alergias": "Penicilina",
        "tipoSangre": "O+",
        "tratamientos": "Enalapril 20mg diarios",
        "pastillas": "Ninguna",
        "vacunas": "COVID-19 (3 dosis)",
        "peso": "82",
        "altura": "178",
        "contactoEmergencia": "+50588888888"
      },
      "userContext": {
        "userId": "usr_998122",
        "nombre": "Pedro García",
        "email": "pedro.garcia@email.com",
        "ciudad": "Granada",
        "pais": "Nicaragua"
      }
    }
    ```

*   **Ejemplo de Respuesta Exitosa (`200 OK`):**
    ```json
    {
      "success": true,
      "patientId": "0e59a489-3221-4fa3-9f82-dd32e652a9ef",
      "bundleResponse": {
        "resourceType": "Bundle",
        "type": "transaction-response",
        "entry": [
          {
            "status": "201 Created",
            "location": "Patient/0e59a489-3221-4fa3-9f82-dd32e652a9ef/_history/1"
          },
          {
            "status": "201 Created",
            "location": "Condition/cf1d902b-a322-4211-bc66-3d234a9ef121/_history/1"
          }
        ]
      }
    }
    ```

---

### `GET /api/fhir-get`
Lee los recursos de salud de un paciente basándose en su Cédula de Identidad en Nicaragua y reconstruye el formato plano consumible por el formulario frontend.

*   **Query Parameters:**
    *   `cedula` (Requerido): Documento de identidad del paciente. Ejemplo: `/api/fhir-get?cedula=001-150590-0002B`

*   **Ejemplo de Respuesta Exitosa (`200 OK`):**
    ```json
    {
      "found": true,
      "patientId": "0e59a489-3221-4fa3-9f82-dd32e652a9ef",
      "data": {
        "cedula": "001-150590-0002B",
        "enfermedades": "Hipertensión arterial",
        "alergias": "Penicilina",
        "tipoSangre": "O+",
        "tratamientos": "Enalapril 20mg diarios",
        "pastillas": "",
        "vacunas": "COVID-19 (3 dosis)",
        "peso": "82",
        "altura": "178",
        "contactoEmergencia": "+50588888888"
      }
    }
    ```
