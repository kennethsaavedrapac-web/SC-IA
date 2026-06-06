import { supabase } from './supabaseClient';

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

// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

export const subscribeToPushNotifications = async (userId: string) => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push no está soportado en este navegador.");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    // Subscribe if not subscribed
    if (!subscription) {
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        console.error("VITE_VAPID_PUBLIC_KEY no está configurada");
        return false;
      }
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    // Retrieve preference from localStorage
    const currentPref = localStorage.getItem("notifPreference") || "consejo";

    // Save to Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ 
        user_id: userId, 
        subscription: subscription.toJSON(),
        preferences: currentPref,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error("Error guardando suscripción:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error en suscripción Push:", err);
    return false;
  }
};

export const showDailyNotification = async (userId: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  // Registra la suscripción para que el servidor pueda mandar notificaciones push
  await subscribeToPushNotifications(userId);

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const storageKey = `lastNotificationDate_${userId}`;
  const lastDate = localStorage.getItem(storageKey);

  if (lastDate !== today) {
    // Es un nuevo día para este usuario, mostrar notificación (Local fallback si app está abierta)
    const randomIndex = Math.floor(Math.random() * DAILY_MESSAGES.length);
    const message = DAILY_MESSAGES[randomIndex];

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.showNotification("Salud-Conecta IA", {
          body: message,
          icon: "/app-logo-v1.jpg",
          badge: "/app-logo-v1.jpg",
          vibrate: [200, 100, 200]
        } as any);
      } else {
        new Notification("Salud-Conecta IA", {
          body: message,
          icon: "/app-logo-v1.jpg"
        });
      }

      localStorage.setItem(storageKey, today);
    } catch (e) {
      console.error("Error mostrando notificación", e);
    }
  }
};
