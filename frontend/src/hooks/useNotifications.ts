import { useCallback, useRef, useState } from 'react'

interface UseNotificationsOptions {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('notifications_sound')
    return stored !== 'false'
  })

  const audioContextRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    return audioContextRef.current
  }, [])

  // Play a bright, multi-tone chime (~2.5 seconds)
  const playChime = useCallback(() => {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    const now = ctx.currentTime

    const notes = [
      { freq: 587.33, start: 0, dur: 0.3 },     // D5
      { freq: 739.99, start: 0.25, dur: 0.3 },   // F#5
      { freq: 880.00, start: 0.5, dur: 0.3 },     // A5
      { freq: 1174.66, start: 0.75, dur: 0.5 },   // D6
      { freq: 880.00, start: 1.3, dur: 0.3 },     // A5
      { freq: 1174.66, start: 1.55, dur: 0.8 },   // D6 (long)
    ]

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + start)
      gain.gain.linearRampToValueAtTime(0.3, now + start + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + dur)
    })
  }, [getAudioContext])

  // Request permission
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      console.warn('Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      setPermission('granted')
      options.onPermissionGranted?.()
      return true
    }

    if (Notification.permission === 'denied') {
      setPermission('denied')
      options.onPermissionDenied?.()
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result === 'granted') {
      options.onPermissionGranted?.()
      return true
    } else {
      options.onPermissionDenied?.()
      return false
    }
  }, [options])

  // Show notification
  const showNotification = useCallback(
    (title: string, body: string, onClick?: () => void) => {
      // Play sound if enabled
      if (soundEnabled) {
        try { playChime() } catch { /* Ignore autoplay errors */ }
      }

      // Show browser notification if permitted
      if (permission === 'granted' && typeof Notification !== 'undefined') {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'order-notification',
        } as NotificationOptions)

        if (onClick) {
          notification.onclick = () => {
            window.focus()
            notification.close()
            onClick()
          }
        }

        // Auto close after 10 seconds
        setTimeout(() => notification.close(), 10000)
      }
    },
    [permission, soundEnabled, playChime]
  )

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev
      localStorage.setItem('notifications_sound', String(newValue))
      return newValue
    })
  }, [])

  // Play test sound
  const playTestSound = useCallback(() => {
    try { playChime() } catch { /* Ignore errors */ }
  }, [playChime])

  return {
    permission,
    soundEnabled,
    requestPermission,
    showNotification,
    toggleSound,
    playTestSound,
  }
}
