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
  status: 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DONE'
  createdAt: string
  items: OrderItem[]
}

interface WaiterCall {
  tableId: number
  tableNumber: number
  restaurantId: number
  calledAt: string
}

interface UseOrdersWebSocketOptions {
  restaurantId: number
  onOrderUpdate: (order: Order) => void
  onWaiterCall?: (call: WaiterCall) => void
}

function getWsUrl() {
  return `${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${window.location.host}/ws`
}

export function useOrdersWebSocket({ restaurantId, onOrderUpdate, onWaiterCall }: UseOrdersWebSocketOptions) {
  const clientRef = useRef<Client | null>(null)

  const connect = useCallback(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected')
        client.subscribe(`/topic/restaurants/${restaurantId}/orders`, (message) => {
          const order: Order = JSON.parse(message.body)
          onOrderUpdate(order)
        })
        client.subscribe(`/topic/restaurants/${restaurantId}/waiter-calls`, (message) => {
          const call: WaiterCall = JSON.parse(message.body)
          onWaiterCall?.(call)
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
  }, [restaurantId, onOrderUpdate, onWaiterCall])

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
