# Plan: Implementar Panel Administrativo Mejorado para Salud-Conecta IA

## Contexto
Basado en la solicitud del usuario, se necesita expandir el panel administrativo inicial con funcionalidades avanzadas:
1. Gestión de Ubicaciones (arrastrar/soltar markers, ver ajuste, restaurar posición)
2. Anuncios y Promociones (banners programables, alertas de salud)
3. Gestión de Centros de Salud (CRUD completo con guardado en base de datos)
4. Gestión de Usuarios (lista, roles, premium, estadísticas)
5. Configuración del Chat IA (modificar prompt, centros de referencia, contexto temporal)
6. Analytics y Dashboard (usuarios activos, consultas, heatmap)
7. Configuración General de la App (feature flags, mensajes de mantenimiento, etc.)

## Enfoque Recomendado
Expandir el panel administrativo existente para incluir todas estas funcionalidades mediante:
- Creación de nuevas tablas en Supabase para almacenar datos administrativos
- Extender los componentes admin existentes
- Añadir nuevas vistas para cada funcionalidad solicitada
- Implementar comunicación bidireccional entre el mapa y los datos de centros
- Crear sistema de anuncios programable

## Archivos Críticos a Modificar/Crear

### 1. Nuevas Tablas en Supabase (requiere migración)
- `admin_announcements` - Para banners y alertas programables
- `health_center_overrides` - Para almacenar posiciones ajustadas y estados de centros
- `ai_configurations` - Para configuraciones modificables del chat IA
- `app_settings` - Para feature flags y configuraciones generales
- `user_extensions` - Para extensión de datos de usuarios (premium, etc.)

### 2. Componentes Nuevos a Crear
- `src/components/admin/LocationManagement.tsx` - Gestión de ubicaciones con mapa D&D
- `src/components/admin/AnnouncementManagement.tsx` - Sistema de anuncios y promociones
- `src/components/admin/HealthCenterCRUD.tsx` - CRUD completo de centros de salud
- `src/components/admin/UserManagementExtended.tsx` - Gestión de usuarios extendida
- `src/components/admin/IAConfigView.tsx` - Configuración del chat IA
- `src/components/admin/AppAnalytics.tsx` - Analytics y dashboard avanzado
- `src/components/admin/GeneralSettings.tsx` - Configuración general de la app

### 3. Componentes Existentes a Mejorar
- `src/components/AdminView.tsx` - Expandir navegación para incluir nuevas secciones
- `src/components/admin/UserManagement.tsx` - Mejorar para incluir estadísticas y premium toggle
- `src/components/admin/HealthUnitManagement.tsx` - Evolucionar a CRUD completo con sincronización BD
- `src/components/admin/SettingsManagement.tsx` - Expandir para incluir feature flags y mantenimiento
- `src/components/admin/AnalyticsView.tsx` - Mejorar con métricas en tiempo real y heatmap

## Detalles de Implementación por Funcionalidad

### 1. 🗺️ Gestión de Ubicaciones
- **Mapa interactivo** usando Leaflet (similar al existente en CentrosView)
- **Funcionalidad de arrastrar y soltar markers** para corregir posiciones
- **Historial de cambios** para poder restaurar posición original
- **Indicadores visuales** de qué centros tienen ajuste vs. cuáles no
- **Validación de límites geográficos** (dentro de fronteras de Nicaragua)
- **Base de datos**: Tabla `health_center_overrides` con campos: id, center_id, lat_override, lng_override, original_lat, original_lng, adjusted_by, adjusted_at, is_active

### 2. 📢 Anuncios y Promociones
- **Banner programable** que se muestra basado en fechas de inicio/fin
- **Tipos de anuncios**: 
  - Banner general (aparece al abrir app)
  - Alertas de salud (color rojo, prioridad alta)
  - Promociones (verdes/azules)
- **Programación**: fecha_inicio, fecha_fin, horario_diario opcional
- **Targeting opcional**: por departamento, municipio, segmento de usuario
- **Base de datos**: Tabla `admin_announcements` con campos: id, tipo, titulo, mensaje, fecha_inicio, fecha_fin, activo, creado_por, creado_en
- **Integración**: Mostrar en App.jsx basado en fecha/hora actual

### 3. 🏥 Gestión de Centros de Salud (CRUD completo)
- **Crear nuevos centros** que no estén en los JSON iniciales
- **Editar existente**: nombre, dirección, teléfono, tipo, horario, SILAIS, etc.
- **Desactivar temporalmente** centros (sin eliminar, modo mantenimiento)
- **Eliminar lógicamente** (marcar como inactivo en lugar de borrar realmente)
- **Sincronización automática** - cambios se reflejan en todos los usuarios al recargar
- **Base de datos**: Usar tabla `health_center_overrides` para sobrescribir datos de JSON
- **Fallback**: Si no hay override, usar datos originales de JSON

### 4. 👥 Gestión de Usuarios
- **Lista paginada** de todos los usuarios registrados
- **Asignar/quitar rol de admin** (actualizar campo role en profiles)
- **Activar/desactivar Premium** para usuarios específicos (campo en user_extensions)
- **Estadísticas básicas**: 
  - Total usuarios
  - Usuarios activos (último login en 7 días)
  - Usuarios premium
  - Nuevos registros (último mes)
  - Distribución por roles
- **Base de datos**: Extender tabla profiles o crear tabla user_extensions

### 5. 🤖 Configuración del Chat IA
- **Editor de prompt del sistema** - modificar las instrucciones que recibe el IA
- **Gestión de centros de referencia** - lista que menciona la IA en sus respuestas
- **Ajuste de contexto temporal** - modificar horarios de centros según día/semana
- **Prueba desde el mismo panel** - interfaz para hacer consultas de prueba
- **Base de datos**: Tabla `ai_configurations` con campos: id, clave, valor, describir, actualizado_por, actualizado_en
- **Integración**: El chat.js lee estas configuraciones en lugar de valores hardcodeados

### 6. 📊 Analytics y Dashboard
- **Usuarios activos**: hoy, esta semana, este mês (basado en last_sign_in_at)
- **Consultas al chat IA**: total, por día, por semana (requeriría tabla de logs o usar Supabase auth logs)
- **Centros más buscados**: contabilizar clicks en marcadores o búsquedas
- **Heatmap de usuarios**: mostrar concentración geográfica de usuarios (requiere ubicación de usuarios)
- **Métricas de rendimiento**: tiempo de respuesta promedio, tasas de error
- **Base de datos**: Posiblemente usar tabla `app_usage_logs` o aprovechar Supabase analytics

### 7. ⚙️ Configuración General de la App
- **Feature flags**: activar/desactivar funciones (premium, nuevas funcionalidades, etc.)
- **Mensajes de mantenimiento**: poner la app "en mantenimiento" con mensaje personalizable
- **Configurar emergencias**: actualizar números (128, Cruz Roja, etc.)
- **Idioma por defecto**: cambiar idioma predeterminado de la aplicación
- **Configuración de PWA**: habilitar/deshabilitar banner, cambiar mensaje
- **Base de datos**: Tabla `app_settings` con pares clave-valor y tipos de datos

## Estrategia de Integración

### Flujo de Datos
1. **Supabase como fuente de verdad** para todos los datos administrativos
2. **Componentes admin** leen y escriben directamente a estas tablas
3. **Componentes de usuario** leen de estas tablas cuando sea relevante (ej: anuncios, overrides de centros)
4. **Cacheo inteligente** en el frontend para reducir llamadas a BD cuando sea apropiado

### Seguridad
- **Protección de rutas**: Ya implementada (solo admins acceden a /admin)
- **Validación en backend**: Todas las modificaciones deben incluir validación server-side
- **Registro de cambios**: Auditoría para quién cambió qué y cuándo
- **Limites de tasa**: Para evitar abusos en operaciones masivas

## Orden de Implementación Sugerido

1. **Primero**: Crear las tablas necesarias en Supabase (estructura básica)
2. **Segundo**: Mejorar componentes admin existentes (UserManagement, SettingsManagement, AnalyticsView)
3. **Tercero**: Implementar LocationManagement (funcionalidad más compleja del mapa)
4. **Cuarto**: Implementar AnnouncementManagement (sistema de banners)
5. **Quinto**: Implementar HealthCenterCRUD (evolución de HealthUnitManagement)
6. **Sexto**: Implementar IAConfigView y GeneralSettings
7. **Séptimo**: Mejorar analytics con métricas en tiempo real
8. **Octavo**: Integrar todo en el AdminView principal con navegación expandida

## Consideraciones Técnicas

### Estado y Actualizaciones en Tiempo Real
- Para anuncios y feature flags que necesitan actualización inmediata, considerar:
  - Supabase Realtime para suscribirse a cambios
  - Polling suave cada 5-10 minutos para datos no críticos
  - Eventos personalizados cuando se hacen cambios desde el admin

### Manejo de Errores y Estados de Carga
- Estados de carga consistentes en todos los componentes
- Manejo elegante de errores de red y validaciones
- Mensajes de usuario amigables en español/inglés según idioma de la app

### Persistencia y Conflictos
- Estrategia "último en ganar" para cambios simultáneos
- Bloqueo suave para elementos siendo editados (opcional)
- Confirmación para acciones destructivas (eliminar, desactivar masivamente)

## Verificación y Testing

### Pruebas Manuales
- Verificar que solo admins puedan acceder a /admin
- Probar cada funcionalidad con datos de prueba
- Verificar que los cambios se reflejen en la app de usuario
- Probar edge cases (fechas inválidas, coordenadas fuera de rango, etc.)

### Integración
- Asegurar que los anuncios se muestren correctamente en la app
- Verificar que los overrides de centros aparezcan en CentrosView
- Confirmar que las configuraciones del IA afecten las respuestas del chat
- Validar que los feature flags habiliten/deshabiliten funcionalidades correctamente

## Próximos Pasos
Una vez aprobado este plan:
1. Ejecutar las migraciones de base de datos necesarias
2. Implementar los componentes en el orden sugerido
3. Integrar con el panel admin existente
4. Probar exhaustivamente cada funcionalidad
5. Documentar el uso para futuros administradores