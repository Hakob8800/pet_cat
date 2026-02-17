import { useEffect, useState, useRef, useCallback } from 'react'
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

interface OrderedItem {
  name: string
  quantity: number
  price: number
}

// --- Skeleton components ---

function SkeletonCard() {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-xl shadow-sm animate-pulse">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-8 bg-gray-200 rounded-full w-20 mt-2" />
      </div>
    </div>
  )
}

function SkeletonMenu() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3 animate-pulse">
          <div className="h-7 bg-gray-200 rounded w-48 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
        </div>
      </header>

      {/* Tab skeleton */}
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-full w-20 flex-shrink-0" />
          <div className="h-8 bg-gray-200 rounded-full w-24 flex-shrink-0" />
          <div className="h-8 bg-gray-200 rounded-full w-16 flex-shrink-0" />
          <div className="h-8 bg-gray-200 rounded-full w-28 flex-shrink-0" />
        </div>
      </div>

      {/* Items skeleton */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        <div className="mb-8">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse" />
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </main>
    </div>
  )
}

// --- Category Tabs ---

function CategoryTabs({
  categories,
  activeCategoryId,
}: {
  categories: Category[]
  activeCategoryId: number | null
}) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  // Auto-scroll to keep active tab visible
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const tab = activeTabRef.current
      const container = tabsRef.current
      const tabLeft = tab.offsetLeft
      const tabWidth = tab.offsetWidth
      const containerWidth = container.offsetWidth
      const scrollLeft = container.scrollLeft

      if (tabLeft < scrollLeft) {
        container.scrollTo({ left: tabLeft - 16, behavior: 'smooth' })
      } else if (tabLeft + tabWidth > scrollLeft + containerWidth) {
        container.scrollTo({ left: tabLeft + tabWidth - containerWidth + 16, behavior: 'smooth' })
      }
    }
  }, [activeCategoryId])

  const handleClick = (categoryId: number) => {
    const el = document.getElementById(`category-${categoryId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (categories.length <= 1) return null

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b">
      <div
        ref={tabsRef}
        className="max-w-2xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId
          return (
            <button
              key={cat.id}
              ref={isActive ? activeTabRef : undefined}
              onClick={() => handleClick(cat.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Main content ---

function PublicMenuContent() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const tableId = searchParams.get('table') ? Number(searchParams.get('table')) : null

  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null)
  const [orderedItems, setOrderedItems] = useState<OrderedItem[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  const { items: cartItems, clearCart } = useCart()

  useEffect(() => {
    if (!slug) return

    getPublicMenu(slug)
      .then((res) => {
        setMenu(res.data)
        // Set initial active category
        if (res.data.categories.length > 0) {
          setActiveCategoryId(res.data.categories[0].id)
        }
      })
      .catch(() => setError('Menu not found'))
      .finally(() => setLoading(false))
  }, [slug])

  // IntersectionObserver for active category tracking
  useEffect(() => {
    if (!menu || menu.categories.length <= 1) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          const id = visible[0].target.id
          const catId = Number(id.replace('category-', ''))
          if (!isNaN(catId)) setActiveCategoryId(catId)
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    )

    menu.categories.forEach((cat) => {
      const el = document.getElementById(`category-${cat.id}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [menu])

  const handleOrderSuccess = useCallback((orderId: number) => {
    // Capture what was ordered before clearing cart
    setOrderedItems(cartItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })))
    setOrderSuccess(orderId)
  }, [cartItems])

  if (loading) {
    return <SkeletonMenu />
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Menu Not Found</h2>
          <p className="text-gray-500">{error || 'This menu is not available.'}</p>
        </div>
      </div>
    )
  }

  if (orderSuccess) {
    const orderTotal = orderedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-1">Order Placed!</h2>
            <p className="text-gray-500 text-sm">Order #{orderSuccess}</p>
          </div>

          {/* Estimated wait */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
            <p className="text-amber-800 text-sm font-medium">Estimated wait: 15-25 min</p>
          </div>

          {/* Order summary */}
          {orderedItems.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your order</h3>
              {orderedItems.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-500">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total</span>
                <span>${orderTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setOrderSuccess(null)
              setOrderedItems([])
              clearCart()
            }}
            className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 active:scale-[0.98] transition-all"
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

      {/* Category tabs */}
      <CategoryTabs categories={menu.categories} activeCategoryId={activeCategoryId} />

      {/* Menu */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {menu.categories.map((category) => (
          <CategorySection
            key={category.id}
            categoryId={category.id}
            name={category.name}
            items={category.items}
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
  const { slug } = useParams()
  return (
    <CartProvider slug={slug}>
      <PublicMenuContent />
    </CartProvider>
  )
}
