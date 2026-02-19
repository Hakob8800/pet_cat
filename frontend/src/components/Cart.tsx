import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { createOrder } from '../api/client'

interface CartProps {
  tableId: number | null
  onOrderSuccess: (orderId: number, restaurantId: number) => void
}

function formatPrice(price: number): string {
  return price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`
}

export default function Cart({ tableId, onOrderSuccess }: CartProps) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (totalItems === 0) return null

  const handleSubmit = async () => {
    if (!tableId) {
      setError('Table not specified. Please scan QR code on your table.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await createOrder({
        tableId,
        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      })
      onOrderSuccess(response.data.orderId, response.data.restaurantId)
      clearCart()
      setIsOpen(false)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-charcoal shadow-cart">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-between px-5 py-4 active:bg-charcoal-light transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white text-charcoal text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
                {totalItems}
              </span>
              <span className="font-semibold text-white">View Order</span>
            </div>
            <span className="font-bold text-white text-lg">{formatPrice(totalPrice)}</span>
          </button>
        </div>
      </div>

      {/* Cart modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        >
          <div className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl animate-slideUp">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-surface-warm px-5 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-charcoal">Your Order</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-warm text-charcoal-light transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Table info */}
            {tableId && (
              <div className="px-5 pt-4">
                <div className="bg-surface-warm text-charcoal-light px-3 py-2 rounded-xl text-sm font-medium">
                  Table {tableId}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="p-5 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-charcoal truncate">{item.name}</div>
                    <div className="text-sm text-bronze font-medium">{formatPrice(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 min-w-[44px] min-h-[44px] rounded-full bg-surface-warm hover:bg-bronze/10 flex items-center justify-center text-lg text-charcoal transition-colors"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-semibold text-charcoal">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 min-w-[44px] min-h-[44px] rounded-full bg-surface-warm hover:bg-bronze/10 flex items-center justify-center text-lg text-charcoal transition-colors"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-charcoal-light/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!tableId && (
              <div className="px-5 pb-2">
                <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm">
                  Please scan QR code on your table to place an order.
                </div>
              </div>
            )}

            {error && (
              <div className="px-5 pb-2">
                <div className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</div>
              </div>
            )}

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-surface-warm p-5">
              <div className="flex justify-between mb-4">
                <span className="font-semibold text-charcoal-light">Total</span>
                <span className="font-bold text-lg text-charcoal">{formatPrice(totalPrice)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !tableId}
                className="w-full bg-charcoal text-white py-3.5 rounded-2xl font-semibold hover:bg-charcoal-light active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
