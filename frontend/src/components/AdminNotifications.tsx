import { useEffect, useState, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getRestaurants } from '../api/client'
import { useNotifications } from '../hooks/useNotifications'

interface OrderItem {
  id: number
  menuItemId: number
  menuItemName: string
  price: number
  quantity: number
}

interface Order {
  id: number
  tableNumber: number
  status: 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DONE'
  createdAt: string
  items: OrderItem[]
}

interface Restaurant {
  id: number
  name: string
  slug: string
}

export default function AdminNotifications({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const clientRef = useRef<Client | null>(null)
  const { showNotification, requestPermission, permission } = useNotifications()

  useEffect(() => {
    if (permission === 'default') {
      requestPermission()
    }
  }, [permission, requestPermission])

  // Load user's restaurants
  useEffect(() => {
    getRestaurants()
      .then((res) => setRestaurants(res.data))
      .catch(() => {})
  }, [])

  // Subscribe to all restaurants via WebSocket
  useEffect(() => {
    if (restaurants.length === 0) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.host}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        restaurants.forEach((r) => {
          client.subscribe(`/topic/restaurants/${r.id}/orders`, (message) => {
            const order: Order = JSON.parse(message.body)
            if (order.status === 'NEW') {
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
              showNotification(
                `New Order - Table ${order.tableNumber}`,
                `${r.name}: ${itemCount} item${itemCount > 1 ? 's' : ''} ordered`
              )
            }
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
  }, [restaurants, showNotification])

  return <>{children}</>
}
