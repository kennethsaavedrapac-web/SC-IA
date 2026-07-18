import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;


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
  
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabase || !publicKey || !privateKey) {
    return res.status(500).json({ error: 'Configuración de base de datos o Web Push faltante.' });
  }

  try {
    
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

    
    const sendPromises = subscriptions.map((subRecord) => {
      const { subscription, preferences } = subRecord;
      const prefsArray = (preferences || 'consejo').split(',');

      
      if (prefsArray.includes('ninguna')) {
        return Promise.resolve();
      }

      let message = "";
      
      
      if (prefsArray.includes('consejo') && prefsArray.includes('recordatorio')) {
         if (Math.random() > 0.5) {
            message = CONSEJOS[Math.floor(Math.random() * CONSEJOS.length)];
         } else {
            message = RECORDATORIOS[Math.floor(Math.random() * RECORDATORIOS.length)];
         }
      } else if (prefsArray.includes('recordatorio')) {
         message = RECORDATORIOS[Math.floor(Math.random() * RECORDATORIOS.length)];
      } else {
         
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
