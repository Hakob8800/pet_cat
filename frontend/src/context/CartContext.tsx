import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | null>(null)

function storageKey(slug: string) {
  return `qrmenu_cart_${slug}`
}

function loadCart(slug: string): CartItem[] {
  try {
    const raw = localStorage.getItem(storageKey(slug))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // corrupted data — ignore
  }
  return []
}

function saveCart(slug: string, items: CartItem[]) {
  try {
    if (items.length === 0) {
      localStorage.removeItem(storageKey(slug))
    } else {
      localStorage.setItem(storageKey(slug), JSON.stringify(items))
    }
  } catch {
    // storage full or unavailable — ignore
  }
}

interface CartProviderProps {
  slug?: string
  children: ReactNode
}

export function CartProvider({ slug, children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(() => (slug ? loadCart(slug) : []))

  // Sync to localStorage whenever items change
  useEffect(() => {
    if (slug) saveCart(slug, items)
  }, [slug, items])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    if (slug) localStorage.removeItem(storageKey(slug))
  }, [slug])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
