import { useCallback, useEffect, useRef, useState } from 'react'

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

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    // Create audio element with a simple beep sound (base64 encoded)
    const audio = new Audio()
    // Short notification sound (base64 WAV)
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkZaYm5eUj4eCeHBpYmBhZGxydoGKkZebn5+dmZSNhHt0bmllZmltcnmAh46Tl5qamJWRjIV/eHJtaWdnaW1xd36Ei5GWmZqZl5OSjYiBe3Vwb3BwcHJ1eX6Dh42Sk5OUk5GQjouHhIB7d3Z1dXV2eHp9gYSIjI+Rk5OTkpGPjYqIhoSBfnt5eHh4eXt9f4KFiIuNkJGRkZCPjYuKiIaEgoB+fHt6enp7fH6AgoWHioyOj5CQj46NjIqJh4aEgoB/fn18fH19fn+BgoSGiImLjI2Njo2MjIuKiYiHhoWEg4KBgH9/f39/f4CBgoOEhYaHiImJiomJiYiIh4eGhoWFhIOCgoKBgYGBgoKCg4OEhIWFhYaGhoaGhoaGhYWFhYWEhISEg4ODg4OCgoKCgoKCgoKCgoKCgoKCgoKCgoKC'
    audio.volume = 0.5
    audioRef.current = audio
  }, [])

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
      if (soundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {
          // Ignore autoplay errors
        })
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
    [permission, soundEnabled]
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
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [])

  return {
    permission,
    soundEnabled,
    requestPermission,
    showNotification,
    toggleSound,
    playTestSound,
  }
}
