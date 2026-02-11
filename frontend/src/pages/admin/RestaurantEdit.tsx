import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { QRCodeSVG } from 'qrcode.react'
import { getRestaurants, updateRestaurant, getTables, createTable, updateTable, deleteTable } from '../../api/client'
import { restaurantSchema, RestaurantFormData } from '../../lib/validations'
import { slugify, getErrorMessage } from '../../lib/utils'
import FormField from '../../components/FormField'

interface Table {
  id: number
  number: number
  isActive: boolean
}

export default function RestaurantEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Tables state
  const [tables, setTables] = useState<Table[]>([])
  const [newTableNumber, setNewTableNumber] = useState('')
  const [isAddingTable, setIsAddingTable] = useState(false)
  const [selectedTableQR, setSelectedTableQR] = useState<number | null>(null)

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

  const loadTables = useCallback(async () => {
    if (!id) return
    try {
      const res = await getTables(Number(id))
      setTables(res.data)
    } catch (err) {
      console.error('Failed to load tables:', err)
    }
  }, [id])

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const loadData = async () => {
      try {
        const res = await getRestaurants()
        const restaurant = res.data.find((r: { id: number }) => r.id === Number(id))
        if (!cancelled && restaurant) {
          reset({
            name: restaurant.name,
            slug: restaurant.slug,
            description: restaurant.description || '',
          })
        }

        // Load tables
        const tablesRes = await getTables(Number(id))
        if (!cancelled) {
          setTables(tablesRes.data)
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

    loadData()

    return () => {
      cancelled = true
    }
  }, [id, reset])

  const onSubmit = async (data: RestaurantFormData) => {
    try {
      setError('')
      await updateRestaurant(Number(id), {
        name: data.name,
        slug: data.slug,
        description: data.description || '',
      })
      navigate('/admin')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleAddTable = async () => {
    if (!newTableNumber || !id) return

    setIsAddingTable(true)
    try {
      setError('')
      await createTable(Number(id), { number: Number(newTableNumber), isActive: true })
      setNewTableNumber('')
      loadTables()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsAddingTable(false)
    }
  }

  const handleToggleTable = async (table: Table) => {
    try {
      setError('')
      await updateTable(table.id, { isActive: !table.isActive })
      loadTables()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDeleteTable = async (tableId: number) => {
    if (!confirm('Delete this table?')) return
    try {
      setError('')
      await deleteTable(tableId)
      loadTables()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const getTableUrl = (tableId: number) => {
    return `${window.location.origin}/menu/${slug}?table=${tableId}`
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Restaurant Settings</h1>
          <Link to="/admin" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
        )}

        {/* Restaurant Info */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Restaurant Info</h2>
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
                    e.target.value = slugify(e.target.value)
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

        {/* Tables Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Tables</h2>

          {/* Add Table Form */}
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              min="1"
              placeholder="Table number"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              className="flex-1 max-w-[200px] p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddTable}
              disabled={isAddingTable || !newTableNumber}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isAddingTable ? 'Adding...' : 'Add Table'}
            </button>
          </div>

          {/* Tables List */}
          {tables.length === 0 ? (
            <p className="text-gray-500">No tables yet. Add tables so guests can place orders.</p>
          ) : (
            <div className="space-y-3">
              {tables.map((table) => (
                <div key={table.id}>
                  <div
                    className={`flex items-center justify-between p-3 rounded border ${
                      table.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">Table {table.number}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          table.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {table.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTableQR(selectedTableQR === table.id ? null : table.id)}
                        className="text-sm px-3 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        QR
                      </button>
                      <button
                        onClick={() => handleToggleTable(table)}
                        className={`text-sm px-3 py-1 rounded ${
                          table.isActive
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {table.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  {selectedTableQR === table.id && (
                    <div className="mt-2 p-4 bg-white border rounded-lg flex flex-col items-center">
                      <p className="text-sm font-medium mb-2">Table {table.number} QR Code</p>
                      <QRCodeSVG value={getTableUrl(table.id)} size={180} />
                      <p className="mt-2 text-xs text-gray-500 break-all text-center max-w-[200px]">
                        {getTableUrl(table.id)}
                      </p>
                      <button
                        onClick={() => {
                          const canvas = document.createElement('canvas')
                          const svg = document.querySelector(`[data-table-qr="${table.id}"]`)?.parentElement?.querySelector('svg')
                          if (svg) {
                            const svgData = new XMLSerializer().serializeToString(svg)
                            const img = new Image()
                            img.onload = () => {
                              canvas.width = img.width
                              canvas.height = img.height
                              const ctx = canvas.getContext('2d')
                              ctx?.drawImage(img, 0, 0)
                              const link = document.createElement('a')
                              link.download = `table-${table.number}-qr.png`
                              link.href = canvas.toDataURL('image/png')
                              link.click()
                            }
                            img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
                          }
                        }}
                        data-table-qr={table.id}
                        className="mt-3 text-sm px-4 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Download PNG
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
