import { markDoseTaken } from './medicationService'

export async function getPushVapidPublicKey() {
  const res = await fetch('/api/push/vapid-public-key')
  const data = await res.json()
  return data.publicKey as string
}

export async function registerForPush(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { success: false, message: 'Push notifications are not supported in this browser.' }
  }

  const permission = Notification.permission
  if (permission === 'default') {
    const granted = await Notification.requestPermission()
    if (granted !== 'granted') {
      return { success: false, message: 'Notification permission was denied.' }
    }
  }

  if (permission === 'denied') {
    return { success: false, message: 'Notification permission was denied.' }
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await registration.update()

    const publicKey = await getPushVapidPublicKey()
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    })

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, subscription }),
    })

    const result = await res.json()
    if (!result.success) {
      return { success: false, message: result.error || 'Failed to save push subscription.' }
    }

    return { success: true, subscription }
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to register push notifications.' }
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async (event) => {
    const type = event.data?.type
    const scheduleId = event.data?.scheduleId

    if (type === 'push-taken' && scheduleId) {
      await markDoseTaken(scheduleId, true)
    }
  })
}
