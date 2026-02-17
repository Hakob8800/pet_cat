import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { createOrder } from '../api/client'

interface CartProps {
  tableId: number | null
  onOrderSuccess: (orderId: number) => void
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
      clearCart()
      setIsOpen(false)
      onOrderSuccess(response.data.orderId)
    } catch {
      setError('Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="bg-green-600 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
                {totalItems}
              </span>
              <span className="font-semibold text-gray-900">View Order</span>
            </div>
            <span className="font-bold text-green-600 text-lg">{formatPrice(totalPrice)}</span>
          </button>
        </div>
      </div>

      {/* Cart modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        >
          <div className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-[slideUp_0.2s_ease-out]">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-semibold">Your Order</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl"
              >
                &times;
              </button>
            </div>

            {/* Table info */}
            {tableId && (
              <div className="px-4 pt-3">
                <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">
                  Table {tableId}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-sm text-gray-500">{formatPrice(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 min-w-[44px] min-h-[44px] rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 min-w-[44px] min-h-[44px] rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
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
              <div className="px-4 pb-2">
                <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg text-sm">
                  Please scan QR code on your table to place an order.
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 pb-2">
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            )}

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4">
              <div className="flex justify-between mb-3">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !tableId}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 active:scale-[0.98] disabled:opacity-50 transition-all"
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
