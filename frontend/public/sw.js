self.addEventListener('push', (event) => {
  const payload = event.data && event.data.json ? event.data.json() : null
  const options = {
    body: payload?.body || 'Medication reminder',
    icon: '/favicon.ico',
    vibrate: payload?.vibrate || [200, 100, 200, 100, 200],
    requireInteraction: payload?.requireInteraction ?? true,
    silent: false,
    data: payload?.data || {},
    actions: payload?.actions || [
      { action: 'taken', title: 'Mark as Taken' },
      { action: 'snooze', title: 'Snooze 10 min' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(payload?.title || 'Medicine Reminder', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification
  const action = event.action

  if (action === 'taken') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        const targetClient = clientList.find((client) => 'focus' in client) || clientList[0]

        if (targetClient) {
          return targetClient.postMessage({
            type: 'push-taken',
            scheduleId: notification.data?.schedule_id,
          })
        }

        return clients.openWindow('/').then((client) => {
          if (client) {
            client.focus()
            client.postMessage({
              type: 'push-taken',
              scheduleId: notification.data?.schedule_id,
            })
          }
        })
      })
    )
  }

  notification.close()
})
