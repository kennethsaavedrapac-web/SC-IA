export const MORNING_TIPS = [
  "Consejo del día: Mantenerte hidratado puede ayudarte a prevenir fatiga y dolores de cabeza.",
  "Consejo del día: Dormir de 7 a 8 horas mejora tu sistema inmunológico.",
  "Consejo del día: Dedica 10 minutos al día para estirarte y reducir la tensión muscular.",
  "Consejo del día: Come una porción extra de vegetales en tu próxima comida.",
  "Consejo del día: Caminar 30 minutos al día fortalece tu corazón.",
  "Consejo del día: Limita el uso de pantallas antes de dormir para un mejor descanso.",
  "Consejo del día: Mantén un registro de tus síntomas para un mejor seguimiento médico.",
  "Consejo del día: Ríete un poco hoy, reír reduce el estrés y mejora tu estado de ánimo.",
  "Consejo del día: Si pasas mucho tiempo sentado, levántate 5 minutos cada hora.",
  "Consejo del día: Usa protector solar todos los días, incluso si está nublado.",
  "Consejo del día: Masticar bien los alimentos mejora tu digestión y asimilación de nutrientes.",
  "Consejo del día: Realizar respiraciones profundas ayuda a calmar la ansiedad y el estrés.",
  "Consejo del día: Evita el exceso de sal y azúcares añadidos en tus comidas diarias.",
  "Consejo del día: Lava tus manos frecuentemente con agua y jabón para evitar infecciones.",
  "Consejo del día: Desayunar de forma equilibrada te da energía para rendir todo el día."
];

export const AFTERNOON_REMINDERS = [
  "Realiza una evaluación rápida de tu estado de salud en este momento.",
  "¿Tienes algún síntoma o duda? Recibe orientación en minutos.",
  "Hace varios días que no registras cómo te sientes. ¿Quieres actualizar tu estado?",
  "Completa tu información en el perfil para recibir recomendaciones más precisas.",
  "Recuerda revisar y programar tus próximos chequeos médicos preventivos.",
  "¿Cómo ha estado tu nivel de energía hoy? Cuéntanos en la app para llevar tu registro.",
  "Una pequeña revisión de tus signos vitales hoy puede prevenir complicaciones mañana.",
  "Explora el mapa de centros de salud cercanos para saber a dónde ir en caso de emergencia.",
  "¿Sabías que puedes tener tu código QR de emergencia siempre listo? Configúralo en tu perfil.",
  "Si has sentido molestias recientes, no dudes en consultar a nuestra IA médica.",
  "Actualiza tu tipo de sangre y contactos de emergencia para mayor seguridad.",
  "Verifica la información de las unidades de salud en tu zona usando nuestra herramienta.",
  "¿Todo en orden con tu salud general? No olvides usar el buscador para aprender más.",
  "Dedica un momento para registrar cualquier cambio en tus condiciones médicas preexistentes.",
  "Tu bienestar es nuestra prioridad. Inicia una consulta rápida si tienes alguna inquietud."
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

export const checkAndShowNotifications = async (userId: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const currentHour = now.getHours();

  const morningKey = `morningNotif_${userId}`;
  const afternoonKey = `afternoonNotif_${userId}`;
  
  const lastMorningDate = localStorage.getItem(morningKey);
  const lastAfternoonDate = localStorage.getItem(afternoonKey);

  const showNotification = async (message: string) => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.showNotification("Salud-Conecta IA", {
          body: message,
          icon: "/app-logo-v1.jpg",
          badge: "/app-logo-v1.jpg",
          vibrate: [200, 100, 200]
        });
      } else {
        new Notification("Salud-Conecta IA", {
          body: message,
          icon: "/app-logo-v1.jpg"
        });
      }
    } catch (e) {
      console.error("Error mostrando notificación", e);
    }
  };

  // Disparar Notificación de Mañana (9:00 AM o más tarde)
  if (currentHour >= 9 && lastMorningDate !== today) {
    const randomIndex = Math.floor(Math.random() * MORNING_TIPS.length);
    await showNotification(MORNING_TIPS[randomIndex]);
    localStorage.setItem(morningKey, today);
  }

  // Disparar Notificación de Tarde (17:00 PM / 5:00 PM o más tarde)
  if (currentHour >= 17 && lastAfternoonDate !== today) {
    // Si justo se está disparando la de la mañana también (porque abrió la app a las 6pm por primera vez hoy), esperamos 5 segundos
    if (currentHour >= 9 && lastMorningDate !== today) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const randomIndex = Math.floor(Math.random() * AFTERNOON_REMINDERS.length);
    await showNotification(AFTERNOON_REMINDERS[randomIndex]);
    localStorage.setItem(afternoonKey, today);
  }
};
