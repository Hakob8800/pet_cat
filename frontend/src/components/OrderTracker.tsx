import { useEffect, useState, useCallback } from 'react'
import { getOrderStatus } from '../api/client'
import { useOrderTrackingWebSocket, TrackedOrder } from '../hooks/useOrderTrackingWebSocket'

type OrderStatusType = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DONE'

const STEPS: { status: OrderStatusType; label: string; desc: string }[] = [
  { status: 'NEW', label: 'Order Placed', desc: 'We received your order' },
  { status: 'CONFIRMED', label: 'Confirmed', desc: 'Kitchen has accepted' },
  { status: 'PREPARING', label: 'Preparing', desc: 'Your food is being made' },
  { status: 'READY', label: 'Ready', desc: 'Ready for pickup' },
  { status: 'DONE', label: 'Complete', desc: 'Enjoy your meal!' },
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

function formatPrice(price: number): string {
  return price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`
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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-warm-lg w-full max-w-sm animate-scaleIn">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-surface-warm text-charcoal-light text-sm font-medium px-3 py-1.5 rounded-full mb-3">
            <span className="w-1.5 h-1.5 bg-bronze rounded-full" />
            Order #{orderId}
          </div>
          <h2 className="text-xl font-bold text-charcoal">
            {status === 'DONE' ? 'Order Complete!' : 'Tracking Your Order'}
          </h2>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isLast = index === STEPS.length - 1

            return (
              <div key={step.status} className="flex items-start gap-4">
                {/* Circle + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                      isCompleted
                        ? 'bg-forest text-white'
                        : isCurrent
                          ? 'bg-charcoal text-white ring-4 ring-charcoal/10'
                          : 'bg-surface-warm text-charcoal-light/30'
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
                  {!isLast && (
                    <div className="w-0.5 h-10 relative bg-surface-warm overflow-hidden">
                      {isCompleted && (
                        <div className="absolute inset-0 bg-forest animate-fillLine" />
                      )}
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className={`pt-1.5 pb-5 transition-opacity duration-300 ${
                  !isCompleted && !isCurrent ? 'opacity-30' : ''
                }`}>
                  <p className={`text-sm font-semibold ${
                    isCurrent ? 'text-charcoal' : isCompleted ? 'text-charcoal-light' : 'text-charcoal-light/50'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && status !== 'DONE' ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 bg-bronze rounded-full animate-pulse" />
                      <span className="text-xs text-bronze font-medium">{step.desc}</span>
                    </div>
                  ) : (isCompleted || (isCurrent && status === 'DONE')) && (
                    <p className="text-xs text-charcoal-light/50 mt-0.5">{step.desc}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        {items.length > 0 && (
          <div className="border-t border-surface-warm pt-5 space-y-2.5">
            <h3 className="text-xs font-semibold text-charcoal-light/50 uppercase tracking-wider">Your order</h3>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-charcoal">
                  <span className="text-charcoal-light/50">{item.quantity}x</span>{' '}
                  {item.name}
                </span>
                <span className="text-bronze font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-3 border-t border-surface-warm">
              <span className="text-charcoal-light">Total</span>
              <span className="text-charcoal">{formatPrice(total)}</span>
            </div>
          </div>
        )}

        {/* Order More button */}
        <button
          onClick={onOrderMore}
          className="w-full mt-6 bg-charcoal text-white py-3.5 rounded-2xl font-semibold hover:bg-charcoal-light active:scale-[0.98] transition-all"
        >
          Order More
        </button>
      </div>
    </div>
  )
}
