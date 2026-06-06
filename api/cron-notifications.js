import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Setup Web Push
const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:soporte@salud-conecta.com';

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

const CONSEJOS = [
  "Consejo del día: Mantenerte hidratado puede ayudarte a prevenir fatiga y dolores de cabeza.",
  "Consejo del día: Dormir de 7 a 8 horas mejora tu sistema inmunológico.",
  "Consejo del día: Dedica 10 minutos al día para estirarte y reducir la tensión muscular.",
  "Consejo del día: Come una porción extra de vegetales en tu próxima comida.",
  "Consejo del día: Caminar 30 minutos al día fortalece tu corazón.",
  "Consejo del día: Limita el uso de pantallas antes de dormir para un mejor descanso."
];

const RECORDATORIOS = [
  "Realiza una evaluación rápida de tu estado de salud.",
  "¿Tienes algún síntoma o duda? Recibe orientación en minutos.",
  "Hace varios días que no registras cómo te sientes. ¿Quieres actualizar tu estado?",
  "Completa tu información para recibir recomendaciones más precisas.",
  "Revisa si tienes alguna cita médica próxima o medicamentos por tomar."
];

export default async function handler(req, res) {
  if (!supabase || !publicKey || !privateKey) {
    return res.status(500).json({ error: 'Configuración de base de datos o Web Push faltante.' });
  }

  try {
    // 1. Obtener todas las suscripciones push de Supabase incluyendo preferencias
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription, preferences');

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No hay suscripciones para notificar.' });
    }

    let sentCount = 0;

    // 2. Enviar notificaciones filtradas por preferencia
    const sendPromises = subscriptions.map((subRecord) => {
      const { subscription, preferences } = subRecord;
      const prefsArray = (preferences || 'consejo').split(',');

      // Si el usuario silenció ambas
      if (prefsArray.includes('ninguna')) {
        return Promise.resolve();
      }

      let message = "";
      
      // Si tiene ambas, elegimos una de forma aleatoria (50% probabilidad)
      if (prefsArray.includes('consejo') && prefsArray.includes('recordatorio')) {
         if (Math.random() > 0.5) {
            message = CONSEJOS[Math.floor(Math.random() * CONSEJOS.length)];
         } else {
            message = RECORDATORIOS[Math.floor(Math.random() * RECORDATORIOS.length)];
         }
      } else if (prefsArray.includes('recordatorio')) {
         message = RECORDATORIOS[Math.floor(Math.random() * RECORDATORIOS.length)];
      } else {
         // Por defecto, o si solo eligió 'consejo', enviamos un consejo
         message = CONSEJOS[Math.floor(Math.random() * CONSEJOS.length)];
      }

      const notificationPayload = JSON.stringify({
        title: 'Salud-Conecta IA',
        body: message,
        url: '/'
      });

      return webpush.sendNotification(subscription, notificationPayload)
        .then(() => { sentCount++; })
        .catch((err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('Subscription has expired or is no longer valid: ', err);
            // Opcional: Eliminar la suscripción inválida
          } else {
            console.error('Error sending push: ', err);
          }
        });
    });

    await Promise.all(sendPromises);

    return res.status(200).json({
      message: `Notificaciones enviadas a ${sentCount} usuarios de ${subscriptions.length} suscritos.`,
      success: true
    });
  } catch (err) {
    console.error('Cron Error:', err);
    return res.status(500).json({ error: 'Error procesando notificaciones', details: err.message });
  }
}
