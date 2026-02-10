import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicMenu } from '../api/client'
import CategorySection from '../components/CategorySection'

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

export default function PublicMenu() {
  const { slug } = useParams()
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return

    getPublicMenu(slug)
      .then((res) => setMenu(res.data))
      .catch(() => setError('Menu not found'))
      .finally(() => setLoading(false))
  }, [slug])

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-center">{menu.restaurantName}</h1>
          {menu.description && (
            <p className="text-gray-600 text-center mt-2">{menu.description}</p>
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
          />
        ))}

        {menu.categories.length === 0 && (
          <p className="text-center text-gray-500">No menu items available</p>
        )}
      </main>
    </div>
  )
}
