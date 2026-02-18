import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getPublicMenu } from '../api/client'
import CategorySection from '../components/CategorySection'
import Cart from '../components/Cart'
import OrderTracker from '../components/OrderTracker'
import { CartProvider, useCart } from '../context/CartContext'

interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
  available?: boolean
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

interface ActiveOrder {
  orderId: number
  restaurantId: number
  items: OrderedItem[]
}

function getStorageKey(slug: string) {
  return `qrmenu_active_order_${slug}`
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
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  const { items: cartItems, clearCart } = useCart()

  // Restore active order from localStorage on mount
  useEffect(() => {
    if (!slug) return
    try {
      const stored = localStorage.getItem(getStorageKey(slug))
      if (stored) {
        const parsed: ActiveOrder = JSON.parse(stored)
        if (parsed.orderId) {
          setActiveOrder(parsed)
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }, [slug])

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

  const handleOrderSuccess = useCallback((orderId: number, restaurantId: number) => {
    const ordered: OrderedItem[] = cartItems.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    }))
    const order: ActiveOrder = { orderId, restaurantId, items: ordered }
    setActiveOrder(order)
    if (slug) {
      localStorage.setItem(getStorageKey(slug), JSON.stringify(order))
    }
  }, [cartItems, slug])

  const handleOrderMore = useCallback(() => {
    setActiveOrder(null)
    clearCart()
    if (slug) {
      localStorage.removeItem(getStorageKey(slug))
    }
  }, [clearCart, slug])

  if (loading) {
    return <SkeletonMenu />
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="text-5xl mb-4">:/</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Menu Not Found</h2>
          <p className="text-gray-500">{error || 'This menu is not available.'}</p>
        </div>
      </div>
    )
  }

  if (activeOrder) {
    return (
      <OrderTracker
        orderId={activeOrder.orderId}
        initialItems={activeOrder.items}
        onOrderMore={handleOrderMore}
      />
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
