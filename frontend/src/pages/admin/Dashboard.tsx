import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../context/AuthContext'
import { getRestaurants, createRestaurant, deleteRestaurant } from '../../api/client'
import { restaurantSchema, RestaurantFormData } from '../../lib/validations'
import { slugify, getErrorMessage } from '../../lib/utils'
import QRCodeGenerator from '../../components/QRCodeGenerator'

interface Restaurant {
  id: number
  name: string
  slug: string
  description?: string
}

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedQR, setSelectedQR] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
  })

  const loadRestaurants = useCallback(async () => {
    try {
      setError('')
      const res = await getRestaurants()
      setRestaurants(res.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setError('')
        const res = await getRestaurants()
        if (!cancelled) {
          setRestaurants(res.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user, authLoading, navigate])

  const onSubmit = async (data: RestaurantFormData) => {
    try {
      setError('')
      await createRestaurant({
        name: data.name,
        slug: data.slug,
        description: data.description || '',
      })
      reset()
      setShowForm(false)
      loadRestaurants()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this restaurant?')) return
    try {
      setError('')
      await deleteRestaurant(id)
      loadRestaurants()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Your Restaurants</h2>
          <button
            onClick={() => {
              setShowForm(!showForm)
              if (showForm) reset()
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Restaurant'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <input
                  type="text"
                  placeholder="Restaurant Name"
                  {...register('name')}
                  className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Slug (url-friendly)"
                  {...register('slug', {
                    onChange: (e) => {
                      e.target.value = slugify(e.target.value)
                    },
                  })}
                  className={`w-full p-2 border rounded ${errors.slug ? 'border-red-500' : ''}`}
                />
                {errors.slug && (
                  <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  {...register('description')}
                  className={`w-full p-2 border rounded ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </form>
        )}

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
