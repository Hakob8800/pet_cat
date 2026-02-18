import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

interface OrderItem {
  id: number
  menuItemId: number
  menuItemName: string
  price: number
  quantity: number
}

export interface TrackedOrder {
  id: number
  tableNumber: number
  status: 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DONE'
  createdAt: string
  items: OrderItem[]
}

interface UseOrderTrackingWebSocketOptions {
  orderId: number | null
  onStatusUpdate: (order: TrackedOrder) => void
}

function getWsUrl() {
  return `${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.host}/ws`
}

export function useOrderTrackingWebSocket({ orderId, onStatusUpdate }: UseOrderTrackingWebSocketOptions) {
  const clientRef = useRef<Client | null>(null)

  const connect = useCallback(() => {
    if (!orderId) return

    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        client.subscribe(`/topic/orders/${orderId}`, (message) => {
          const order: TrackedOrder = JSON.parse(message.body)
          onStatusUpdate(order)
        })
      },
      onStompError: (frame) => {
        console.error('Order tracking STOMP error:', frame)
      },
    })

    client.activate()
    clientRef.current = client
  }, [orderId, onStatusUpdate])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { disconnect }
}
