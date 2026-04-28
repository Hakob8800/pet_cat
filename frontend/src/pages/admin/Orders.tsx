import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrders, updateOrderStatus } from '../../api/client'
import { getErrorMessage } from '../../lib/utils'
import { useOrdersWebSocket } from '../../hooks/useOrdersWebSocket'
import { useNotifications } from '../../hooks/useNotifications'

type OrderStatusType = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DONE'

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
  status: OrderStatusType
  createdAt: string
  items: OrderItem[]
}

const STATUS_CONFIG: Record<OrderStatusType, { label: string; color: string; border: string; bg: string }> = {
  NEW: { label: 'New', color: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-500', bg: 'bg-yellow-50' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', border: 'border-blue-500', bg: 'bg-blue-50' },
  PREPARING: { label: 'Preparing', color: 'bg-orange-100 text-orange-800', border: 'border-orange-500', bg: 'bg-orange-50' },
  READY: { label: 'Ready', color: 'bg-green-100 text-green-800', border: 'border-green-500', bg: 'bg-green-50' },
  DONE: { label: 'Done', color: 'bg-gray-100 text-gray-600', border: 'border-gray-300', bg: 'bg-gray-50' },
}

const NEXT_ACTION: Record<string, { label: string; buttonClass: string }> = {
  NEW: { label: 'Confirm', buttonClass: 'bg-blue-600 hover:bg-blue-700' },
  CONFIRMED: { label: 'Start Preparing', buttonClass: 'bg-orange-600 hover:bg-orange-700' },
  PREPARING: { label: 'Mark Ready', buttonClass: 'bg-green-600 hover:bg-green-700' },
  READY: { label: 'Mark Done', buttonClass: 'bg-gray-600 hover:bg-gray-700' },
}

const NEXT_STATUS: Record<string, OrderStatusType> = {
  NEW: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'DONE',
}

export default function Orders() {
  const { id: restaurantId } = useParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const originalTitle = useRef(document.title)

  const {
    permission,
    soundEnabled,
    requestPermission,
    toggleSound,
    playTestSound,
  } = useNotifications()

  // Request notification permission on mount
  useEffect(() => {
    if (permission === 'default') {
      requestPermission()
    }
  }, [permission, requestPermission])

  // Update page title with active order count
  const updatePageTitle = useCallback((activeCount: number) => {
    if (activeCount > 0) {
      document.title = `(${activeCount}) Active Orders - QR Menu`
    } else {
      document.title = originalTitle.current
    }
  }, [])

  // Restore title on unmount
  useEffect(() => {
    return () => {
      document.title = originalTitle.current
    }
  }, [])

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return
    try {
      setError('')
      const res = await getOrders(Number(restaurantId))
      setOrders(res.data)
      const activeCount = res.data.filter((o: Order) => o.status !== 'DONE').length
      updatePageTitle(activeCount)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [restaurantId, updatePageTitle])

  // WebSocket handler for real-time updates — only manages order list state,
  // toasts/notifications are handled globally by AdminNotifications
  const handleOrderUpdate = useCallback((updatedOrder: Order) => {
    setOrders((prev) => {
      const exists = prev.find((o) => o.id === updatedOrder.id)
      if (exists) {
        const updated = prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        updatePageTitle(updated.filter((o) => o.status !== 'DONE').length)
        return updated
      }
      const updated = [updatedOrder, ...prev]
      updatePageTitle(updated.filter((o) => o.status !== 'DONE').length)
      return updated
    })
  }, [updatePageTitle])

  // Connect to WebSocket for real-time order list updates
  useOrdersWebSocket({
    restaurantId: Number(restaurantId),
    onOrderUpdate: handleOrderUpdate,
  })

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleAdvanceStatus = async (orderId: number, currentStatus: OrderStatusType) => {
    if (!restaurantId || currentStatus === 'DONE' || updatingOrderId) return
    const nextStatus = NEXT_STATUS[currentStatus]
    if (!nextStatus) return
    setUpdatingOrderId(orderId)
    try {
      await updateOrderStatus(orderId, nextStatus, Number(restaurantId))
      // WebSocket will handle the update automatically
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUpdatingOrderId(null)
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

  const activeOrders = orders.filter((o) => o.status !== 'DONE')
  const doneOrders = orders.filter((o) => o.status === 'DONE')

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            Orders
            {activeOrders.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {activeOrders.length}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-4">
            {/* Notification Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-full ${
                  permission === 'granted' && soundEnabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
                title="Notification settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {showSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border p-4 z-10">
                  <h3 className="font-semibold mb-3">Notifications</h3>

                  {/* Browser Notifications */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm">Browser alerts</span>
                    {permission === 'granted' ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Enabled</span>
                    ) : permission === 'denied' ? (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Blocked</span>
                    ) : (
                      <button
                        onClick={requestPermission}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Enable
                      </button>
                    )}
                  </div>

                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm">Sound</span>
                    <button
                      onClick={toggleSound}
                      className={`relative w-10 h-6 rounded-full transition-colors ${
                        soundEnabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          soundEnabled ? 'left-5' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Test Sound */}
                  <button
                    onClick={playTestSound}
                    className="w-full text-sm text-gray-600 hover:text-gray-800 py-1"
                  >
                    Test sound
                  </button>
                </div>
              )}
            </div>

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

        {/* Active Orders */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
            Active Orders ({activeOrders.length})
          </h2>

          {activeOrders.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded-lg">No active orders</p>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const config = STATUS_CONFIG[order.status]
                const action = NEXT_ACTION[order.status]
                return (
                  <div key={order.id} className={`bg-white p-4 rounded-lg shadow border-l-4 ${config.border}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-lg font-bold">Table {order.tableNumber}</span>
                          <span className="text-gray-500 ml-3">#{order.id}</span>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.color}`}>
                          {config.label}
                        </span>
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
                      {action && (
                        <button
                          onClick={() => handleAdvanceStatus(order.id, order.status)}
                          disabled={updatingOrderId === order.id}
                          className={`text-white px-4 py-2 rounded transition-colors ${action.buttonClass} disabled:opacity-50`}
                        >
                          {updatingOrderId === order.id ? 'Updating...' : action.label}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
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
