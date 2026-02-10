import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getRestaurants, createRestaurant, deleteRestaurant } from '../../api/client'
import QRCodeGenerator from '../../components/QRCodeGenerator'

interface Restaurant {
  id: number
  name: string
  slug: string
  description?: string
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [selectedQR, setSelectedQR] = useState<string | null>(null)

  useEffect(() => {
    loadRestaurants()
  }, [])

  const loadRestaurants = async () => {
    const res = await getRestaurants()
    setRestaurants(res.data)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createRestaurant({ name, slug, description })
    setName('')
    setSlug('')
    setDescription('')
    setShowForm(false)
    loadRestaurants()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this restaurant?')) return
    await deleteRestaurant(id)
    loadRestaurants()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">QR Menu Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Add Restaurant Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Your Restaurants</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Restaurant'}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="text"
                placeholder="Restaurant Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Slug (url-friendly)"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Create
            </button>
          </form>
        )}

        {/* Restaurant List */}
        <div className="space-y-4">
          {restaurants.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{r.name}</h3>
                  <p className="text-gray-500 text-sm">/{r.slug}</p>
                  {r.description && <p className="text-gray-600 mt-1">{r.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedQR(selectedQR === r.slug ? null : r.slug)}
                    className="text-purple-600 hover:underline"
                  >
                    QR
                  </button>
                  <Link
                    to={`/admin/restaurant/${r.id}/menu`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit Menu
                  </Link>
                  <Link
                    to={`/admin/restaurant/${r.id}`}
                    className="text-gray-600 hover:underline"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {selectedQR === r.slug && (
                <div className="mt-4">
                  <QRCodeGenerator slug={r.slug} />
                </div>
              )}
            </div>
          ))}

          {restaurants.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No restaurants yet. Create one to get started.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
