# Especificación Técnica: Modelo de Datos y Métricas Ponderadas de Triaje IA
**Proyecto:** Salud Conecta IA  
**Rol:** Ingeniero de Datos / Desarrollador Backend Senior  
**Estado:** Aprobado para Implementación  

---

## 1. Contexto y Diagnóstico del Fallo
Actualmente, el sistema calcula la actividad de forma lineal y no normalizada. Al registrarse una sola interacción de triaje, la visualización de la carga del sistema se incrementa al 100% de inmediato. Esto representa un fallo grave de realismo operativo:
*   Un servidor web o servicio de API de IA no se satura por un único caso activo.
*   La actividad global se debe medir frente a un baseline operativo histórico de tráfico medio-alto (denominador de escala).
*   Se necesita diferenciar entre **uso de recursos/concurrencia del servidor** y **caudal acumulado de interacciones**.

Para solucionar este fallo, introducimos un modelo de datos ponderado que mapea las interacciones sobre capacidades de diseño reales y baselines volumétricos.

---

## 2. Lógica Matemática de Ponderación

### A. Carga de Servidor ($L_{server}$)
Mide la presión de concurrencia actual sobre la infraestructura de servidores de Salud Conecta IA y el API de Gemini.

$$L_{server} = \min\left(100\%, \left( \frac{U_{active}}{C_{max}} \right) \times 100\right)$$

*   **$U_{active}$**: Usuarios con sesiones de triaje activas simultáneamente en la ventana móvil actual de 5 minutos.
*   **$C_{max}$**: Capacidad máxima de atención simultánea teórica configurada en el clúster de servidores de backend y límites de cuota de la API de IA (Configurada en $250$ sesiones concurrentes para un servidor mediano).
*   **Comportamiento:**
    *   Si $U_{active} = 1 \implies L_{server} = 0.4\%$.
    *   Si $U_{active} = 45 \implies L_{server} = 18.0\%$.

### B. Actividad de Carga de Trabajo ($A_{workload}$)
Mide la intensidad del tráfico acumulado en una ventana de una hora, comparándolo con un promedio histórico de operación normal-alta.

$$A_{workload} = \min\left(100\%, \left( \frac{M_{hour}}{M_{baseline}} \right) \times 100\right)$$

*   **$M_{hour}$**: Total de mensajes procesados por el motor de triaje en la última hora.
*   **$M_{baseline}$**: Baseline histórico de mensajes por hora (Configurado en $500$ interacciones/hora para representar un rendimiento óptimo de nivel medio).
*   **Comportamiento:**
    *   Si $M_{hour} = 1 \implies A_{workload} = 0.2\%$.
    *   Si $M_{hour} = 120 \implies A_{workload} = 24.0\%$.

---

## 3. Estructura y Pipeline del Modelo de Datos (Esquema Supabase/SQL)

En un entorno real de producción, estas métricas se extraen de la base de datos PostgreSQL utilizando una consulta analítica periódica. El siguiente query de SQL muestra cómo calcular eficientemente estas variables usando agregaciones sobre la tabla de eventos de triaje `triage_sessions` y `messages`:

```sql
WITH ActiveSessions AS (
    -- Sesiones con actividad en los últimos 5 minutos
    SELECT COUNT(DISTINCT user_id) as active_users
    FROM triage_sessions
    WHERE last_activity_at >= NOW() - INTERVAL '5 minutes'
),
HourlyMessages AS (
    -- Mensajes enviados en la última hora
    SELECT COUNT(*) as message_count
    FROM messages
    WHERE created_at >= NOW() - INTERVAL '1 hour'
),
SeverityStats AS (
    -- Clasificación de casos según el nivel de urgencia asignado por la IA
    SELECT 
        severity_level,
        COUNT(*) as count,
        ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 1) as percentage
    FROM triage_sessions
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY severity_level
)
SELECT 
    active_users as concurrent_users,
    message_count as messages_last_hour,
    -- Servidor ponderado (Base 250)
    LEAST(100.0, ROUND((active_users::numeric / 250.0) * 100, 1)) as server_load_pct,
    -- Carga de trabajo ponderada (Base 500)
    LEAST(100.0, ROUND((message_count::numeric / 500.0) * 100, 1)) as workload_activity_pct
FROM ActiveSessions, HourlyMessages;
```

---

## 4. Estructura de Salida JSON (API de Métricas)

El endpoint del API de administración debe retornar un JSON con la siguiente estructura robusta para soportar gráficos de líneas (historial), gráficos de dona (distribución de severidad), embudos (tasa de conversión) y kpis directos (carga y latencias):

```json
{
  "timestamp": "2026-07-17T09:59:00Z",
  "systemStatus": {
    "serverLoad": 18.0,
    "workloadActivity": 24.0,
    "activeUsers": 45,
    "messagesLastHour": 120,
    "status": "healthy"
  },
  "severityDistribution": [
    { "category": "Crítico", "color": "Red", "count": 6, "percentage": 13.3 },
    { "category": "Urgente", "color": "Orange", "count": 14, "percentage": 31.1 },
    { "category": "Menor", "color": "Yellow", "count": 18, "percentage": 40.0 },
    { "category": "No Urgente", "color": "Green", "count": 7, "percentage": 15.6 }
  ],
  "performance": {
    "averageResponseTimeSeconds": 1.84,
    "p95ResponseTimeSeconds": 2.95,
    "p99ResponseTimeSeconds": 3.42,
    "apiSuccessRate": 99.8
  },
  "conversionFunnel": {
    "sessionsStarted": 58,
    "messagesSent": 313,
    "triageCompleted": 43,
    "conversionRate": 74.1,
    "dropoutRate": 25.9,
    "dropoutDetails": {
      "firstMessageOnly": 8,
      "middleFlow": 7
    }
  },
  "interactionAnalytics": {
    "averageMessagesPerSession": 5.4,
    "mostCommonSymptom": "Fiebre",
    "symptomFrequencies": {
      "Fiebre": 15,
      "Dolor de cabeza": 12,
      "Tos": 8,
      "Falta de aire": 6,
      "Otros": 4
    }
  }
}
```

Este esquema de datos simula un **tráfico operativo medio** real, asegurando coherencia matemática:
*   $\text{Usuarios activos} = 45 \implies \text{Carga del servidor} = 18\%$.
*   $\text{Mensajes en la última hora} = 120 \implies \text{Actividad del sistema} = 24\%$.
*   $\text{Casos totales en severidad} = 6 + 14 + 18 + 7 = 45$ (igual al número de usuarios activos/casos concurrentes evaluados).
*   $\text{Mensajes por sesión promedio} = 5.4$ de triaje clínico, consistente con el rango óptimo de 4 a 7 interacciones.
*   $\text{Tasa de conversión} = 43 / 58 = 74.1\%$.
