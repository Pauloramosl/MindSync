// Service Worker para Lembretes e Notificações Locais em Dispositivos Móveis (PWA)

self.addEventListener('install', (event) => {
  // Força o Service Worker a se tornar ativo imediatamente
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Reivindica o controle de todas as páginas abertas imediatamente
  event.waitUntil(self.clients.claim());
  console.log('[Service Worker] Ativo e pronto para gerenciar notificações móveis.');
});

// Trata o clique do usuário na notificação do celular
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Fecha o banner de notificação nativa

  // Procura por qualquer janela (aba) do app aberta para focar nela
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já houver uma aba aberta, foca nela
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            return clientList[i];
          }
        }
        return client.focus();
      }
      
      // Caso contrário, abre uma nova janela do app na raiz
      return self.clients.openWindow('/');
    })
  );
});
