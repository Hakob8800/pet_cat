import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getPublicMenu } from '../api/client'
import CategorySection from '../components/CategorySection'
import Cart from '../components/Cart'
import { CartProvider, useCart } from '../context/CartContext'

interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
}

interface Category {
  id: number
  name: string
  items: MenuItem[]
}

interface Menu {
  restaurantName: string
  description?: string
  categories: Category[]
}

function PublicMenuContent() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const tableId = searchParams.get('table') ? Number(searchParams.get('table')) : null

  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null)
  const { addItem } = useCart()

  useEffect(() => {
    if (!slug) return

    getPublicMenu(slug)
      .then((res) => setMenu(res.data))
      .catch(() => setError('Menu not found'))
      .finally(() => setLoading(false))
  }, [slug])

  const handleAddToCart = (item: { id: number; name: string; price: number }) => {
    addItem(item)
  }

  const handleOrderSuccess = (orderId: number) => {
    setOrderSuccess(orderId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error || 'Menu not found'}</div>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm mx-4">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-4">
            Your order #{orderSuccess} has been sent to the kitchen.
          </p>
          <button
            onClick={() => setOrderSuccess(null)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Order More
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-center">{menu.restaurantName}</h1>
          {menu.description && (
            <p className="text-gray-600 text-center mt-2">{menu.description}</p>
          )}
          {tableId && (
            <p className="text-center mt-2 text-sm text-blue-600">Table {tableId}</p>
          )}
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {menu.categories.map((category) => (
          <CategorySection
            key={category.id}
            name={category.name}
            items={category.items}
            onAddToCart={handleAddToCart}
          />
        ))}

        {menu.categories.length === 0 && (
          <p className="text-center text-gray-500">No menu items available</p>
        )}
      </main>

      {/* Cart */}
      <Cart tableId={tableId} onOrderSuccess={handleOrderSuccess} />
    </div>
  )
}

export default function PublicMenu() {
  return (
    <CartProvider>
      <PublicMenuContent />
    </CartProvider>
  )
}
