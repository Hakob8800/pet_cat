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

interface Order {
  id: number
  tableNumber: number
  status: 'NEW' | 'DONE'
  createdAt: string
  items: OrderItem[]
}

interface UseOrdersWebSocketOptions {
  restaurantId: number
  onOrderUpdate: (order: Order) => void
}

export function useOrdersWebSocket({ restaurantId, onOrderUpdate }: UseOrdersWebSocketOptions) {
  const clientRef = useRef<Client | null>(null)

  const connect = useCallback(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected')
        client.subscribe(`/topic/restaurants/${restaurantId}/orders`, (message) => {
          const order: Order = JSON.parse(message.body)
          onOrderUpdate(order)
        })
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected')
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame)
      },
    })

    client.activate()
    clientRef.current = client
  }, [restaurantId, onOrderUpdate])

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
