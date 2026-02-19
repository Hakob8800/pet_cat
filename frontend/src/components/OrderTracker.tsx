import { useEffect, useState, useCallback } from 'react'
import { getOrderStatus } from '../api/client'
import { useOrderTrackingWebSocket, TrackedOrder } from '../hooks/useOrderTrackingWebSocket'

type OrderStatusType = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DONE'

const STEPS: { status: OrderStatusType; label: string }[] = [
  { status: 'NEW', label: 'Order Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PREPARING', label: 'Preparing' },
  { status: 'READY', label: 'Ready' },
  { status: 'DONE', label: 'Done' },
]

function getStepIndex(status: OrderStatusType): number {
  return STEPS.findIndex((s) => s.status === status)
}

interface OrderedItem {
  name: string
  quantity: number
  price: number
}

interface OrderTrackerProps {
  orderId: number
  initialItems: OrderedItem[]
  onOrderMore: () => void
}

export default function OrderTracker({ orderId, initialItems, onOrderMore }: OrderTrackerProps) {
  const [status, setStatus] = useState<OrderStatusType>('NEW')
  const [items, setItems] = useState<OrderedItem[]>(initialItems)

  // Fetch current status on mount (handles page refresh)
  useEffect(() => {
    getOrderStatus(orderId)
      .then((res) => {
        setStatus(res.data.status)
        if (res.data.items && res.data.items.length > 0) {
          setItems(
            res.data.items.map((i: { menuItemName: string; quantity: number; price: number }) => ({
              name: i.menuItemName,
              quantity: i.quantity,
              price: i.price,
            }))
          )
        }
      })
      .catch(() => {})
  }, [orderId])

  const handleStatusUpdate = useCallback((order: TrackedOrder) => {
    setStatus(order.status)
  }, [])

  useOrderTrackingWebSocket({
    orderId,
    onStatusUpdate: handleStatusUpdate,
  })

  const currentIndex = getStepIndex(status)
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm">Order #{orderId}</p>
          <h2 className="text-xl font-bold mt-1">
            {status === 'DONE' ? 'Order Complete!' : 'Tracking Your Order'}
          </h2>
        </div>

        {/* Stepper */}
        <div className="space-y-0 mb-6">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isPending = index > currentIndex

            return (
              <div key={step.status} className="flex items-start gap-3">
                {/* Connector + Circle */}
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isCurrent
                          ? 'bg-green-600 text-white ring-4 ring-green-100'
                          : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  {/* Connector line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-0.5 h-8 transition-colors duration-300 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                {/* Label */}
                <div className={`pt-1 ${isPending ? 'opacity-40' : ''}`}>
                  <p
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-green-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && status !== 'DONE' && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600">In progress</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        {items.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your order</h3>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Order More button */}
        <button
          onClick={onOrderMore}
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 active:scale-[0.98] transition-all"
        >
          Order More
        </button>
      </div>
    </div>
  )
}
