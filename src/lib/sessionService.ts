/**
 * Gestión de Sesión Segura y Cookies HttpOnly
 * Protege contra XSS y secuestro de tokens mediante sincronización con cookies del servidor.
 */

export interface SessionCookiePayload {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Registra o sincroniza el token de autenticación en la cookie segura HttpOnly del backend.
 */
export async function syncSessionCookie(payload: SessionCookiePayload): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Incluir cookies SameSite
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.warn('No se pudo sincronizar la cookie de sesión con el servidor:', error);
    return false;
  }
}

/**
 * Invalida la cookie HttpOnly en el backend de forma segura al cerrar sesión o por inactividad.
 */
export async function clearServerSessionCookie(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.warn('Error al limpiar cookie de sesión en servidor:', error);
    return false;
  }
}

/**
 * Notificador de actividad entre pestañas usando BroadcastChannel.
 */
class CrossTabSync {
  private channel: BroadcastChannel | null = null;
  private channelName = 'sc_auth_session_channel';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(this.channelName);
    }
  }

  public notifyActivity(): void {
    if (this.channel) {
      this.channel.postMessage({ type: 'USER_ACTIVITY', timestamp: Date.now() });
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('sc_last_activity_ping', Date.now().toString());
    }
  }

  public notifyLogout(reason: 'manual' | 'idle_timeout'): void {
    if (this.channel) {
      this.channel.postMessage({ type: 'FORCE_LOGOUT', reason, timestamp: Date.now() });
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('sc_force_logout_event', JSON.stringify({ reason, time: Date.now() }));
    }
  }

  public onMessage(callback: (msg: { type: string; reason?: string; timestamp: number }) => void): () => void {
    if (this.channel) {
      const handler = (event: MessageEvent) => callback(event.data);
      this.channel.addEventListener('message', handler);
      return () => this.channel?.removeEventListener('message', handler);
    }

    if (typeof window !== 'undefined') {
      const storageHandler = (e: StorageEvent) => {
        if (e.key === 'sc_force_logout_event' && e.newValue) {
          const parsed = JSON.parse(e.newValue);
          callback({ type: 'FORCE_LOGOUT', reason: parsed.reason, timestamp: parsed.time });
        } else if (e.key === 'sc_last_activity_ping') {
          callback({ type: 'USER_ACTIVITY', timestamp: Number(e.newValue) });
        }
      };
      window.addEventListener('storage', storageHandler);
      return () => window.removeEventListener('storage', storageHandler);
    }

    return () => {};
  }
}

export const crossTabSync = new CrossTabSync();
