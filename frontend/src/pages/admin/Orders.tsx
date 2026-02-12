import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrders, updateOrderStatus } from '../../api/client'
import { getErrorMessage } from '../../lib/utils'
import { useOrdersWebSocket } from '../../hooks/useOrdersWebSocket'

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

export default function Orders() {
  const { id: restaurantId } = useParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return
    try {
      setError('')
      const res = await getOrders(Number(restaurantId))
      setOrders(res.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  // WebSocket handler for real-time updates
  const handleOrderUpdate = useCallback((updatedOrder: Order) => {
    setOrders((prev) => {
      const exists = prev.find((o) => o.id === updatedOrder.id)
      if (exists) {
        // Update existing order
        return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      }
      // New order - add to beginning
      return [updatedOrder, ...prev]
    })
  }, [])

  // Connect to WebSocket for real-time updates
  useOrdersWebSocket({
    restaurantId: Number(restaurantId),
    onOrderUpdate: handleOrderUpdate,
  })

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleMarkDone = async (orderId: number) => {
    if (!restaurantId) return
    try {
      await updateOrderStatus(orderId, 'DONE', Number(restaurantId))
      // WebSocket will handle the update automatically
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    return date.toLocaleDateString()
  }

  const newOrders = orders.filter((o) => o.status === 'NEW')
  const doneOrders = orders.filter((o) => o.status === 'DONE')

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Orders</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={loadOrders}
              className="text-blue-600 hover:underline"
            >
              Refresh
            </button>
            <Link to={`/admin/restaurant/${restaurantId}/menu`} className="text-gray-600 hover:underline">
              Edit Menu
            </Link>
            <Link to="/admin" className="text-gray-600 hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        {/* New Orders */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
            New Orders ({newOrders.length})
          </h2>

          {newOrders.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded-lg">No new orders</p>
          ) : (
            <div className="space-y-4">
              {newOrders.map((order) => (
                <div key={order.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-lg font-bold">Table {order.tableNumber}</span>
                      <span className="text-gray-500 ml-3">#{order.id}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                      <div className="font-medium">{formatTime(order.createdAt)}</div>
                    </div>
                  </div>

                  <div className="border-t pt-3 mb-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between py-1">
                        <span>
                          <span className="font-medium">{item.quantity}x</span>{' '}
                          {item.menuItemName}
                        </span>
                        <span className="text-gray-600">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center border-t pt-3">
                    <div className="font-bold">
                      Total: $
                      {order.items
                        .reduce((sum, item) => sum + item.price * item.quantity, 0)
                        .toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleMarkDone(order.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      Mark as Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed Orders */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Completed ({doneOrders.length})
          </h2>

          {doneOrders.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded-lg">No completed orders</p>
          ) : (
            <div className="space-y-3">
              {doneOrders.map((order) => (
                <div key={order.id} className="bg-white p-4 rounded-lg shadow opacity-75">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">Table {order.tableNumber}</span>
                      <span className="text-gray-500 ml-2">#{order.id}</span>
                      <span className="text-gray-400 ml-2">
                        {order.items.length} items
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(order.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
