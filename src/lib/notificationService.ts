export const DAILY_MESSAGES = [
  "Realiza una evaluación rápida de tu estado de salud.",
  "¿Tienes algún síntoma o duda? Recibe orientación en minutos.",
  "Hace varios días que no registras cómo te sientes. ¿Quieres actualizar tu estado?",
  "Completa tu información para recibir recomendaciones más precisas.",
  "Consejo del día: Mantenerte hidratado puede ayudarte a prevenir fatiga y dolores de cabeza.",
  "Consejo del día: Dormir de 7 a 8 horas mejora tu sistema inmunológico.",
  "Consejo del día: Dedica 10 minutos al día para estirarte y reducir la tensión muscular.",
  "Consejo del día: Come una porción extra de vegetales en tu próxima comida.",
  "Consejo del día: Caminar 30 minutos al día fortalece tu corazón.",
  "Consejo del día: Limita el uso de pantallas antes de dormir para un mejor descanso.",
  "Consejo del día: Mantén un registro de tus síntomas para un mejor seguimiento médico.",
  "Consejo del día: Ríete un poco hoy, reír reduce el estrés y mejora tu estado de ánimo.",
  "Consejo del día: Si pasas mucho tiempo sentado, levántate 5 minutos cada hora.",
  "Consejo del día: Usa protector solar todos los días, incluso si está nublado."
];

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("Este navegador no soporta notificaciones.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const showDailyNotification = async (userId: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const storageKey = `lastNotificationDate_${userId}`;
  const lastDate = localStorage.getItem(storageKey);

  if (lastDate !== today) {
    // Es un nuevo día para este usuario, mostrar notificación
    // Seleccionar un mensaje aleatorio
    const randomIndex = Math.floor(Math.random() * DAILY_MESSAGES.length);
    const message = DAILY_MESSAGES[randomIndex];

    try {
      // Intentar mostrar notificación a través del Service Worker si existe
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.showNotification("Salud-Conecta IA", {
          body: message,
          icon: "/app-logo-v1.jpg",
          badge: "/app-logo-v1.jpg",
          vibrate: [200, 100, 200]
        });
      } else {
        // Fallback a notificación estándar
        new Notification("Salud-Conecta IA", {
          body: message,
          icon: "/app-logo-v1.jpg"
        });
      }

      // Guardar la fecha para no volver a mostrar hoy
      localStorage.setItem(storageKey, today);
    } catch (e) {
      console.error("Error mostrando notificación", e);
    }
  }
};
