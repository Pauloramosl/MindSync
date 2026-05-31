// Service Worker para notificacoes locais do MindSync em desktop e PWA mobile.

const DEFAULT_NOTIFICATION_URL = '/?view=inbox';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('[Service Worker] Ativo e pronto para gerenciar notificacoes.');
});

function readPushPayload(event) {
  if (!event.data) return {};

  try {
    return event.data.json();
  } catch {
    return {
      title: 'MindSync',
      body: event.data.text()
    };
  }
}

function getNotificationUrl(notification) {
  const data = notification.data || {};
  return data.url || DEFAULT_NOTIFICATION_URL;
}

async function focusOrOpenApp(notification) {
  const data = notification.data || {};
  const targetUrl = new URL(getNotificationUrl(notification), self.location.origin).href;
  const clientList = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });

  const appClients = clientList.filter((client) => {
    try {
      return new URL(client.url).origin === self.location.origin;
    } catch {
      return false;
    }
  });

  const focusedClient = appClients.find((client) => client.focused);
  const targetClient = focusedClient || appClients[0];

  if (targetClient) {
    await targetClient.focus();
    targetClient.postMessage({
      type: 'OPEN_NOTIFICATION_TARGET',
      view: data.view || 'inbox',
      targetType: data.targetType,
      targetId: data.targetId,
      notificationId: data.notificationId
    });
    return;
  }

  await self.clients.openWindow(targetUrl);
}

self.addEventListener('push', (event) => {
  const payload = readPushPayload(event);
  const title = payload.title || 'MindSync';
  const options = {
    body: payload.body || 'Voce tem um item pendente para verificar.',
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    tag: payload.tag || 'mindsync-reminder',
    data: payload.data || { url: DEFAULT_NOTIFICATION_URL, view: 'inbox' },
    actions: payload.actions || [
      { action: 'open', title: 'Verificar' },
      { action: 'dismiss', title: 'Depois' }
    ],
    renotify: payload.renotify !== false,
    timestamp: payload.timestamp || Date.now(),
    vibrate: payload.vibrate || [160, 80, 160]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(focusOrOpenApp(event.notification));
});
