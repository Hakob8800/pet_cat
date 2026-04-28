import { useEffect, useState, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getRestaurants } from '../api/client'
import { useNotifications } from '../hooks/useNotifications'

interface Toast {
  id: number
  type: 'order' | 'waiter'
  title: string
  body: string
  duration: number
}

interface Restaurant {
  id: number
  name: string
  slug: string
}

// --- Toast card ---

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [progress, setProgress] = useState(100)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const step = 100 / (toast.duration / 100)
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p - step <= 0) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return p - step
      })
    }, 100)
    return () => clearInterval(intervalRef.current!)
  }, [toast.duration])

  const isWaiter = toast.type === 'waiter'

  return (
    <div
      className={`relative w-80 bg-white rounded-xl shadow-lg border overflow-hidden ${
        isWaiter ? 'border-amber-300' : 'border-green-300'
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWaiter ? 'bg-amber-400' : 'bg-green-500'}`} />

      <div className="pl-4 pr-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <span className="text-xl leading-none mt-0.5">{isWaiter ? '🔔' : '🛎'}</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">{toast.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">{toast.body}</p>
            </div>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-0.5 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="h-0.5 bg-gray-100">
        <div
          className={`h-full ${isWaiter ? 'bg-amber-400' : 'bg-green-500'}`}
          style={{ width: `${progress}%`, transition: 'none' }}
        />
      </div>
    </div>
  )
}

// --- Main component ---

export default function AdminNotifications({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const clientRef = useRef<Client | null>(null)
  const { showNotification, requestPermission, permission } = useNotifications()

  useEffect(() => {
    if (permission === 'default') requestPermission()
  }, [permission, requestPermission])

  useEffect(() => {
    getRestaurants()
      .then((res) => setRestaurants(res.data))
      .catch(() => {})
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, toast.duration + 400)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToastRef = useRef(addToast)
  const showNotificationRef = useRef(showNotification)
  addToastRef.current = addToast
  showNotificationRef.current = showNotification

  useEffect(() => {
    if (restaurants.length === 0) return

    const wsUrl = `${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.host}/ws`
    const multipleRestaurants = restaurants.length > 1

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        restaurants.forEach((r) => {
          client.subscribe(`/topic/restaurants/${r.id}/orders`, (message) => {
            const order = JSON.parse(message.body)
            if (order.status !== 'NEW') return
            const itemCount = order.items.reduce(
              (sum: number, i: { quantity: number }) => sum + i.quantity, 0
            )
            const label = multipleRestaurants
              ? `${r.name} · Table ${order.tableNumber}`
              : `Table ${order.tableNumber}`
            addToastRef.current({
              type: 'order',
              title: 'New Order',
              body: `${label} — ${itemCount} item${itemCount !== 1 ? 's' : ''}`,
              duration: 8000,
            })
            showNotificationRef.current(
              `New Order – Table ${order.tableNumber}`,
              `${itemCount} item${itemCount !== 1 ? 's' : ''} ordered`
            )
          })

          client.subscribe(`/topic/restaurants/${r.id}/waiter-calls`, (message) => {
            const call = JSON.parse(message.body)
            const label = multipleRestaurants
              ? `${r.name} · Table ${call.tableNumber}`
              : `Table ${call.tableNumber}`
            addToastRef.current({
              type: 'waiter',
              title: 'Waiter Requested',
              body: label,
              duration: 15000,
            })
            showNotificationRef.current(
              `Waiter Requested – Table ${call.tableNumber}`,
              'A guest needs assistance'
            )
          })
        })
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [restaurants])

  return (
    <>
      {children}

      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </>
  )
}
