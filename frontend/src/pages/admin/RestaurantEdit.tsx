import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getRestaurants, updateRestaurant } from '../../api/client'
import { restaurantSchema, RestaurantFormData } from '../../lib/validations'
import FormField from '../../components/FormField'

export default function RestaurantEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
  })

  const slug = watch('slug')

  useEffect(() => {
    loadRestaurant()
  }, [id])

  const loadRestaurant = async () => {
    const res = await getRestaurants()
    const restaurant = res.data.find((r: { id: number }) => r.id === Number(id))
    if (restaurant) {
      reset({
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description || '',
      })
    }
    setLoading(false)
  }

  const onSubmit = async (data: RestaurantFormData) => {
    await updateRestaurant(Number(id), {
      name: data.name,
      slug: data.slug,
      description: data.description || '',
    })
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
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-4">
            <FormField label="Name" error={errors.name}>
              <input
                type="text"
                {...register('name')}
                className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : ''
                }`}
              />
            </FormField>

            <FormField label="Slug" error={errors.slug} hint={`Menu URL: /menu/${slug || ''}`}>
              <input
                type="text"
                {...register('slug', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  },
                })}
                className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.slug ? 'border-red-500' : ''
                }`}
              />
            </FormField>

            <FormField label="Description" error={errors.description}>
              <textarea
                {...register('description')}
                className={`w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : ''
                }`}
                rows={3}
              />
            </FormField>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
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
