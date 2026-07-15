// lib/utils/pushManager.ts
// Helper utilities for registering the service worker and subscribing to push notifications.

/** Register the service worker located at /sw.js */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (typeof window === "undefined" || !('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser');
  }
  const registration = await navigator.serviceWorker.register('/sw.js');
  console.log('Service worker registered:', registration);
  return registration;
}

/** Convert a base64 VAPID public key to a Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Subscribe the user to push notifications and send the subscription to the backend */
export async function subscribeUser(
  registration: ServiceWorkerRegistration,
  publicVapidKey: string,
  token: string | null = null
): Promise<any> {
  if (!registration) {
    throw new Error('Service worker registration is required');
  }
  console.log('Attempting push subscription with VAPID key');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey) as any
  });

  const activeToken = token || localStorage.getItem('token') || localStorage.getItem('workerToken') || localStorage.getItem('adminToken');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  // Send subscription to backend using relative path
  console.log(`Sending subscription to backend:`, subscription);
  const response = await fetch(`/api/notifications/subscribe`, {
    method: 'POST',
    headers,
    body: JSON.stringify(subscription)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to subscribe');
  }
  return response.json();
}
