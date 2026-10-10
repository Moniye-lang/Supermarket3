// public/sw.js - AMStores Web Push & Lifecycle Service Worker
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'AMstores';
  const targetUrl = data.url || '/';

  const options = {
    body: data.body || 'You have a new order or fulfillment update.',
    icon: '/icon-192.png?v=3',
    badge: '/icon-192.png?v=3',
    data: { url: targetUrl },
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  let targetUrl = event.notification.data?.url || '/';
  try {
    targetUrl = new URL(targetUrl, self.location.origin).href;
  } catch (e) {
    targetUrl = self.location.origin + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin)) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
