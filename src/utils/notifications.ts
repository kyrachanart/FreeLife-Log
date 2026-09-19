/**
 * PWA & Browser System Notification Helper
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return Notification.permission;
  }
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export interface SendNotificationParams {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  silent?: boolean;
}

export async function sendSystemNotification({
  title,
  body,
  tag = 'freelife-notification',
  icon = '/apple-touch-icon.png',
  badge = '/favicon.png',
  silent = false,
}: SendNotificationParams): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Try service worker notification first for PWA compliance
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            body,
            icon,
            badge,
            tag,
            silent,
            renotify: true,
            vibrate: [200, 100, 200],
          } as NotificationOptions);
          return true;
        }
      } catch {
        // Fallback to standard window Notification
      }
    }

    // Standard Desktop / Browser Notification
    const notif = new Notification(title, {
      body,
      icon,
      badge,
      tag,
      silent,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (error) {
    console.warn('Failed to send notification:', error);
    return false;
  }
}
