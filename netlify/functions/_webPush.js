/* global process */
import webPush from 'web-push';

export function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:mindsync@example.com';

  return {
    publicKey,
    privateKey,
    subject,
    configured: Boolean(publicKey && privateKey)
  };
}

export function configureWebPush() {
  const vapid = getVapidConfig();

  if (!vapid.configured) {
    throw new Error('VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY precisam estar configuradas.');
  }

  webPush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  return webPush;
}

export function createPushPayload(reminder) {
  return JSON.stringify({
    title: reminder.title || 'MindSync',
    body: reminder.body || 'Voce tem um item pendente para verificar.',
    tag: reminder.tag || `mindsync-${reminder.id}`,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      notificationId: reminder.id,
      targetType: reminder.targetType,
      targetId: reminder.targetId,
      view: reminder.view || 'inbox',
      url: reminder.url || '/?view=inbox'
    },
    actions: [
      { action: 'open', title: 'Verificar' },
      { action: 'dismiss', title: 'Depois' }
    ],
    renotify: true,
    vibrate: [160, 80, 160],
    timestamp: Date.now()
  });
}
