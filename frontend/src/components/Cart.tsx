import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { createOrder } from '../api/client'

interface CartProps {
  tableId: number | null
  onOrderSuccess: (orderId: number) => void
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
    } catch (err) {
      setError('Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating cart button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-green-700 transition-colors z-40"
      >
        <span className="text-xl">🛒</span>
        <span className="font-semibold">{totalItems}</span>
        <span className="ml-2">${totalPrice.toFixed(2)}</span>
      </button>

      {/* Cart modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Order</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Table info */}
            {tableId && (
              <div className="px-4 pt-3">
                <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm">
                  Table {tableId}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">${item.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!tableId && (
              <div className="px-4 pb-2">
                <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded text-sm">
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
                <span className="font-bold text-lg">${totalPrice.toFixed(2)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !tableId}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
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
