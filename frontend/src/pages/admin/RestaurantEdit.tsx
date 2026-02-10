import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRestaurants, updateRestaurant } from '../../api/client'

export default function RestaurantEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRestaurant()
  }, [id])

  const loadRestaurant = async () => {
    const res = await getRestaurants()
    const restaurant = res.data.find((r: { id: number }) => r.id === Number(id))
    if (restaurant) {
      setName(restaurant.name)
      setSlug(restaurant.slug)
      setDescription(restaurant.description || '')
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateRestaurant(Number(id), { name, slug, description })
    navigate('/admin')
  }

  if (loading) return <div className="p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Edit Restaurant</h1>
          <Link to="/admin" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Menu URL: /menu/{slug}
              </p>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
            <Link
              to="/admin"
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
