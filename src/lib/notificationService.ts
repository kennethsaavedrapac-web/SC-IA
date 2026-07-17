import { supabase } from './supabaseClient';

export interface AppNotificationRecord {
  id: string;
  externalId?: string;
  title: string;
  body: string;
  createdAt: string;
  dateKey: string;
  read: boolean;
  source: "daily" | "push" | "announcement";
  category?: "alert" | "banner" | "promotion";
}

interface AdminAnnouncementInput {
  id: string;
  tipo: "alert" | "banner" | "promotion";
  titulo: string;
  mensaje: string;
}

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

const NOTIFICATION_HISTORY_PREFIX = "notificationHistory";

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getHistoryKey = (userId: string) => `${NOTIFICATION_HISTORY_PREFIX}_${userId || "guest"}`;

export const getNotificationHistory = (userId: string): AppNotificationRecord[] => {
  try {
    const stored = localStorage.getItem(getHistoryKey(userId));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is AppNotificationRecord => {
      return Boolean(item && item.id && item.title && item.body && item.createdAt && item.dateKey);
    });
  } catch (err) {
    console.warn("No se pudo leer el historial de notificaciones:", err);
    return [];
  }
};

export const getTodaysNotificationHistory = (userId: string) => {
  const today = getLocalDateKey();
  return getNotificationHistory(userId)
    .filter((item) => item.dateKey === today)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const saveNotificationRecord = (
  userId: string,
  notification: Omit<AppNotificationRecord, "id" | "createdAt" | "dateKey" | "read">
) => {
  try {
    const now = new Date();
    const history = getNotificationHistory(userId);
    if (notification.externalId && history.some((item) => item.externalId === notification.externalId)) {
      return null;
    }

    const record: AppNotificationRecord = {
      ...notification,
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now.toISOString(),
      dateKey: getLocalDateKey(now),
      read: false,
    };

    const nextHistory = [record, ...history].slice(0, 80);
    localStorage.setItem(getHistoryKey(userId), JSON.stringify(nextHistory));
    window.dispatchEvent(new CustomEvent("salud-notifications-updated"));
    return record;
  } catch (err) {
    console.warn("No se pudo guardar el historial de notificaciones:", err);
    return null;
  }
};

export const saveAdminAnnouncementRecords = (userId: string, announcements: AdminAnnouncementInput[]) => {
  try {
    const history = getNotificationHistory(userId);
    const existingIds = new Set(history.map((item) => item.externalId).filter(Boolean));
    const now = new Date();
    const newRecords: AppNotificationRecord[] = announcements
      .filter((announcement) => announcement.id && !existingIds.has(`admin-announcement-${announcement.id}`))
      .map((announcement, index) => ({
        id: `${now.getTime()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        externalId: `admin-announcement-${announcement.id}`,
        title: announcement.titulo,
        body: announcement.mensaje,
        createdAt: new Date(now.getTime() + index).toISOString(),
        dateKey: getLocalDateKey(now),
        read: false,
        source: "announcement",
        category: announcement.tipo,
      }));

    if (newRecords.length === 0) return [];

    localStorage.setItem(getHistoryKey(userId), JSON.stringify([...newRecords, ...history].slice(0, 80)));
    window.dispatchEvent(new CustomEvent("salud-notifications-updated"));
    return newRecords;
  } catch (err) {
    console.warn("No se pudieron guardar los anuncios en el historial:", err);
    return [];
  }
};

export const markTodaysNotificationsRead = (userId: string) => {
  try {
    const today = getLocalDateKey();
    const history = getNotificationHistory(userId);
    let changed = false;
    const nextHistory = history.map((item) => {
      if (item.dateKey === today && !item.read) {
        changed = true;
        return { ...item, read: true };
      }
      return item;
    });

    if (changed) {
      localStorage.setItem(getHistoryKey(userId), JSON.stringify(nextHistory));
      window.dispatchEvent(new CustomEvent("salud-notifications-updated"));
    }
    return nextHistory.filter((item) => item.dateKey === today);
  } catch (err) {
    console.warn("No se pudieron marcar las notificaciones como leídas:", err);
    return getTodaysNotificationHistory(userId);
  }
};


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
    
    
    if (!subscription) {
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicVapidKey || publicVapidKey === "tu_vapid_public_key_aqui" || publicVapidKey.includes("YOUR_")) {
        console.warn("VITE_VAPID_PUBLIC_KEY no está configurada con una clave válida. Saltando suscripción Push.");
        return false;
      }
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    
    const currentPref = localStorage.getItem("notifPreference") || "consejo";

    
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
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn("No se pudo registrar la suscripción Push con el servicio del navegador (posible bloqueo de red o clave inválida).", err);
    } else {
      console.error("Error en suscripción Push:", err);
    }
    return false;
  }
};

export const showDailyNotification = async (userId: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  
  await subscribeToPushNotifications(userId);

  const today = getLocalDateKey();
  const storageKey = `lastNotificationDate_${userId}`;
  const lastDate = localStorage.getItem(storageKey);

  if (lastDate !== today) {
    
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

      saveNotificationRecord(userId, {
        title: "Salud-Conecta IA",
        body: message,
        source: "daily"
      });
      localStorage.setItem(storageKey, today);
    } catch (e) {
      console.error("Error mostrando notificación", e);
    }
  }
};
