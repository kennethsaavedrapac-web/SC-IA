/**
 * Componente de Notificación de Actualizaciones Responsivo y Premium
 * Salud-Conecta IA
 */

export const APP_VERSION = "v1.0.9";
const DISMISS_KEY = "updateNotificationDismissedAt";
const REAPPEAR_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

// Estilos CSS que se inyectarán en el documento
const CSS_STYLES = `
  /* Contenedor de la notificación */
  #update-notification-root {
    position: fixed;
    z-index: 99999;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
    opacity: 0;
    box-sizing: border-box;
  }

  #update-notification-root * {
    box-sizing: border-box;
  }

  /* Diseño adaptativo usando Media Queries */
  
  /* MÓVIL (Celular) - Bottom Sheet de ancho completo */
  @media (max-width: 768px) {
    #update-notification-root {
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      transform: translateY(100%);
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 24px 24px 0 0;
      box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.08), 0 -8px 10px -6px rgba(0, 0, 0, 0.05);
      padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px;
    }
    
    .un-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
    }

    .un-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      text-align: center;
    }

    .un-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
    }

    .un-btn-primary {
      height: 48px; /* Táctil premium >= 44px */
      width: 100%;
    }

    .un-btn-secondary {
      height: 44px; /* Táctil premium >= 44px */
      width: 100%;
    }

    .un-close-btn {
      display: none; /* Se descarta con "Más tarde" */
    }
  }

  /* ESCRITORIO (Laptop) - Toast flotante en esquina inferior derecha */
  @media (min-width: 769px) {
    #update-notification-root {
      bottom: 24px;
      right: 24px;
      width: 380px;
      transform: translateX(120%);
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 20px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      padding: 20px 22px;
    }

    .un-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
    }

    .un-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-right: 20px; /* Espacio para la X */
    }

    .un-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }

    .un-btn-primary {
      height: 38px;
      padding: 0 20px;
    }

    .un-btn-secondary {
      height: 38px;
      padding: 0 14px;
    }

    .un-close-btn {
      position: absolute;
      top: -4px;
      right: -4px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      transition: all 0.2s ease;
    }

    .un-close-btn:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #475569;
    }
  }

  /* Soporte de MODO OSCURO (Dark Mode) */
  html.dark #update-notification-root {
    background: rgba(15, 23, 42, 0.92);
    border-color: rgba(51, 65, 85, 0.8);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) {
    html.dark #update-notification-root {
      border-top: 1px solid rgba(51, 65, 85, 0.8);
    }
  }

  html.dark .un-close-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #f1f5f9;
  }

  /* Tipografía y Textos */
  .un-title {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 16px;
    line-height: 1.3;
    margin: 0;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  @media (max-width: 768px) {
    .un-title {
      justify-content: center;
      font-size: 18px;
    }
  }

  html.dark .un-title {
    color: #ffffff;
  }

  .un-desc {
    font-size: 13px;
    line-height: 1.45;
    margin: 0;
    color: #64748b;
    font-weight: 400;
  }

  html.dark .un-desc {
    color: #94a3b8;
  }

  /* Icono de Campana / Sparkle */
  .un-icon {
    color: #3b82f6;
    animation: un-bounce 2s infinite;
    display: inline-flex;
    align-items: center;
  }

  @keyframes un-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  /* Botón Principal (Actualizar) */
  .un-btn-primary {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    color: #ffffff;
    font-weight: 600;
    font-size: 14px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .un-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
    filter: brightness(1.05);
  }

  .un-btn-primary:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
    filter: brightness(0.95);
  }

  /* Botón Secundario (Más tarde) */
  .un-btn-secondary {
    background: transparent;
    color: #64748b;
    font-weight: 500;
    font-size: 13.5px;
    border: 1px solid rgba(203, 213, 225, 0.8);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  html.dark .un-btn-secondary {
    color: #94a3b8;
    border-color: rgba(71, 85, 105, 0.8);
  }

  .un-btn-secondary:hover {
    background: rgba(0, 0, 0, 0.03);
    color: #0f172a;
    border-color: rgba(148, 163, 184, 0.8);
  }

  html.dark .un-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    border-color: rgba(100, 116, 139, 0.8);
  }

  /* Estado Activo para Animación de Entrada */
  #update-notification-root.active {
    opacity: 1;
  }

  @media (max-width: 768px) {
    #update-notification-root.active {
      transform: translateY(0);
    }
  }

  @media (min-width: 769px) {
    #update-notification-root.active {
      transform: translateX(0);
    }
  }
`;

/**
 * Inyecta los estilos CSS en el head del documento si no existen
 */
function injectStyles() {
  const styleId = "update-notification-styles";
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = CSS_STYLES;
    document.head.appendChild(styleElement);
  }
}

/**
 * Verifica si se debe mostrar la notificación de actualización basándose en el descarte
 */
export function shouldShowNotification(): boolean {
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return true;
  
  const elapsed = Date.now() - parseInt(dismissedAt, 10);
  return elapsed > REAPPEAR_INTERVAL;
}

/**
 * Guarda el descarte en localStorage para no molestar por 24h
 */
export function dismissUpdateNotification(): void {
  localStorage.setItem(DISMISS_KEY, Date.now().toString());
}

/**
 * Muestra el componente de actualización responsivo en pantalla.
 * 
 * @param onConfirm Callback cuando el usuario pulsa "Actualizar"
 * @param onCancel Callback opcional cuando el usuario pulsa "Más tarde" o cierra
 * @param force Si es true, ignora la restricción de las 24 horas (útil para comprobaciones manuales)
 */
export function showUpdateNotification(
  onConfirm: () => void,
  onCancel?: () => void,
  force = false
): void {
  // Evitar duplicados
  if (document.getElementById("update-notification-root")) {
    return;
  }

  // Si no se fuerza la aparición y no debe mostrarse (debido al descarte de 24h), salimos
  if (!force && !shouldShowNotification()) {
    console.log("[UpdateNotification] Notificación ignorada recientemente (límite de 24 horas activo).");
    return;
  }

  // Inyectar estilos CSS
  injectStyles();

  // Crear contenedor principal
  const container = document.createElement("div");
  container.id = "update-notification-root";

  // Estructura HTML interna
  container.innerHTML = `
    <div class="un-container">
      <button class="un-close-btn" id="un-close" aria-label="Cerrar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <div class="un-content">
        <h4 class="un-title">
          <span class="un-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </span>
          ¡Nueva versión disponible!
        </h4>
        <p class="un-desc">Hay mejoras y correcciones listas. Actualiza ahora para disfrutar de la mejor experiencia en Salud-Conecta IA.</p>
      </div>
      <div class="un-actions">
        <button class="un-btn-secondary" id="un-later">Más tarde</button>
        <button class="un-btn-primary" id="un-update">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Actualizar
        </button>
      </div>
    </div>
  `;

  // Añadir al DOM
  document.body.appendChild(container);

  // Trigger de la animación de entrada tras un breve delay (pintado en el DOM)
  setTimeout(() => {
    container.classList.add("active");
  }, 50);

  // Función para cerrar y destruir el componente
  const destroy = (saveDismiss = false) => {
    if (saveDismiss) {
      dismissUpdateNotification();
    }
    
    // Quitar clase active para animar la salida
    container.classList.remove("active");
    
    // Esperar a que la transición termine para remover del DOM
    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === "transform" || e.propertyName === "opacity") {
        container.removeEventListener("transitionend", handleTransitionEnd);
        container.remove();
      }
    };
    
    container.addEventListener("transitionend", handleTransitionEnd);
    
    // Fallback de seguridad por si no se dispara transitionend
    setTimeout(() => {
      if (container.parentNode) {
        container.remove();
      }
    }, 500);
  };

  // Enlazar Eventos
  const updateBtn = container.querySelector("#un-update");
  const laterBtn = container.querySelector("#un-later");
  const closeBtn = container.querySelector("#un-close");

  updateBtn?.addEventListener("click", () => {
    destroy(false); // No guardamos descarte de 24h porque el usuario aceptó
    onConfirm();
  });

  laterBtn?.addEventListener("click", () => {
    destroy(true); // Guardar descarte de 24h para no molestar
    if (onCancel) onCancel();
  });

  closeBtn?.addEventListener("click", () => {
    destroy(true); // Cerrar desde la 'X' también cuenta como ignorar por 24h
    if (onCancel) onCancel();
  });
}

/**
 * Busca actualizaciones de forma activa en el Service Worker y notifica al usuario
 * 
 * @param registration Objeto de registro de Service Worker activo
 * @param forceCheck Si es true, omite limitaciones e interactúa con el usuario directamente
 */
export async function checkForUpdates(
  registration: ServiceWorkerRegistration | null,
  forceCheck = false
): Promise<{ updateFound: boolean; error?: string }> {
  if (!registration) {
    return { updateFound: false, error: "Service Worker no registrado" };
  }

  try {
    console.log("[UpdateNotification] Buscando actualizaciones en el Service Worker...");
    // Intentar disparar la búsqueda de actualización en segundo plano del navegador
    await registration.update();
    
    // Comprobar si hay un trabajador esperando
    if (registration.waiting) {
      return { updateFound: true };
    }
    
    // Comprobar si se está instalando uno nuevo
    if (registration.installing) {
      return new Promise((resolve) => {
        const worker = registration.installing;
        if (!worker) {
          resolve({ updateFound: false });
          return;
        }
        
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed") {
            resolve({ updateFound: true });
          } else if (worker.state === "redundant") {
            resolve({ updateFound: false });
          }
        });
        
        // Timeout de seguridad de 5s para el estado instalándose
        setTimeout(() => resolve({ updateFound: false }), 5000);
      });
    }

    return { updateFound: false };
  } catch (error: any) {
    console.error("[UpdateNotification] Error al buscar actualizaciones:", error);
    return { updateFound: false, error: error.message || String(error) };
  }
}
