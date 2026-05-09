// useDesktopNotifications — a thin wrapper on the browser Notification API.
//
// Usage pattern on the dashboard:
//   const n = useDesktopNotifications();
//   useEffect(() => {
//     if (!snapshot) return;
//     if (snapshot.nextTransit.found && snapshot.nextTransit.daysUntil === 0) {
//       n.notify('Transit today', `${planetName} enters ${toSignName}`);
//     }
//   }, [snapshot]);

import { useCallback, useEffect, useState } from 'react';

type Perm = 'default' | 'granted' | 'denied' | 'unsupported';

function currentPerm(): Perm {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return (Notification.permission as any) as Perm;
}

export function useDesktopNotifications() {
  const [permission, setPermission] = useState<Perm>(currentPerm());
  const supported = permission !== 'unsupported';

  useEffect(() => {
    // Sync periodically in case user changed browser permission in settings
    const iv = setInterval(() => setPermission(currentPerm()), 15_000);
    return () => clearInterval(iv);
  }, []);

  const request = useCallback(async () => {
    if (!supported) return permission;
    try {
      const p = await Notification.requestPermission();
      setPermission(p as Perm);
      return p as Perm;
    } catch {
      return permission;
    }
  }, [supported, permission]);

  const notify = useCallback((title: string, body?: string, opts: NotificationOptions = {}) => {
    if (!supported) return null;
    if (permission !== 'granted') return null;
    try {
      return new Notification(title, { body, ...opts });
    } catch {
      return null;
    }
  }, [supported, permission]);

  return { supported, permission, request, notify };
}
