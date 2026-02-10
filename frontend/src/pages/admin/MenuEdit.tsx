import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getItems,
  createItem,
  updateItem,
  deleteItem
} from '../../api/client'

interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
  imageUrl?: string
  available: boolean
  position: number
}

interface Category {
  id: number
  name: string
  position: number
  items?: MenuItem[]
}

export default function MenuEdit() {
  const { id: restaurantId } = useParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<number | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')

  // Item form state
  const [showItemForm, setShowItemForm] = useState<number | null>(null)
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemImageUrl, setItemImageUrl] = useState('')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  useEffect(() => {
    loadCategories()
  }, [restaurantId])

  const loadCategories = async () => {
    const res = await getCategories(Number(restaurantId))
    const cats = res.data

    // Load items for each category
    const catsWithItems = await Promise.all(
      cats.map(async (cat: Category) => {
        const itemsRes = await getItems(cat.id)
        return { ...cat, items: itemsRes.data }
      })
    )
    setCategories(catsWithItems)
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    await createCategory(Number(restaurantId), {
      name: newCategoryName,
      position: categories.length
    })
    setNewCategoryName('')
    loadCategories()
  }

  const handleUpdateCategory = async (catId: number) => {
    await updateCategory(catId, { name: editCategoryName })
    setEditingCategory(null)
    loadCategories()
  }

  const handleDeleteCategory = async (catId: number) => {
    if (!confirm('Delete this category and all its items?')) return
    await deleteCategory(catId)
    loadCategories()
  }

  const resetItemForm = () => {
    setItemName('')
    setItemDescription('')
    setItemPrice('')
    setItemImageUrl('')
    setEditingItem(null)
    setShowItemForm(null)
  }

  const handleAddItem = async (categoryId: number) => {
    await createItem(categoryId, {
      name: itemName,
      description: itemDescription || undefined,
      price: parseFloat(itemPrice),
      imageUrl: itemImageUrl || undefined,
      available: true,
      position: categories.find(c => c.id === categoryId)?.items?.length || 0
    })
    resetItemForm()
    loadCategories()
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return
    await updateItem(editingItem.id, {
      name: itemName,
      description: itemDescription || undefined,
      price: parseFloat(itemPrice),
      imageUrl: itemImageUrl || undefined,
      available: editingItem.available
    })
    resetItemForm()
    loadCategories()
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Delete this item?')) return
    await deleteItem(itemId)
    loadCategories()
  }

  const handleToggleAvailable = async (item: MenuItem) => {
    await updateItem(item.id, {
      name: item.name,
      price: item.price,
      available: !item.available
    })
    loadCategories()
  }

  const startEditItem = (item: MenuItem, categoryId: number) => {
    setEditingItem(item)
    setItemName(item.name)
    setItemDescription(item.description || '')
    setItemPrice(item.price.toString())
    setItemImageUrl(item.imageUrl || '')
    setShowItemForm(categoryId)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Edit Menu</h1>
          <Link to="/admin" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-2">
          <input
            type="text"
            placeholder="New category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Category
          </button>
        </form>

        {/* Categories */}
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow">
              {/* Category Header */}
              <div className="p-4 border-b flex justify-between items-center">
                {editingCategory === category.id ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="flex-1 p-2 border rounded"
                    />
                    <button
                      onClick={() => handleUpdateCategory(category.id)}
                      className="text-green-600 hover:underline"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="text-gray-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category.id)
                          setEditCategoryName(category.name)
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Items */}
              <div className="p-4 space-y-3">
                {category.items?.map((item) => (
                  <div
                    key={item.id}
                    className={`flex justify-between items-center p-3 rounded border ${
                      !item.available ? 'bg-gray-100 opacity-60' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-green-600">${item.price.toFixed(2)}</span>
                        {!item.available && (
                          <span className="text-xs bg-gray-300 px-2 py-1 rounded">Hidden</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className="text-purple-600 hover:underline text-sm"
                      >
                        {item.available ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => startEditItem(item, category.id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add/Edit Item Form */}
                {showItemForm === category.id ? (
                  <div className="p-4 border rounded bg-gray-50 space-y-3">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Price"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="w-32 p-2 border rounded"
                        step="0.01"
                        min="0"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Image URL (optional)"
                        value={itemImageUrl}
                        onChange={(e) => setItemImageUrl(e.target.value)}
                        className="flex-1 p-2 border rounded"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editingItem ? handleUpdateItem() : handleAddItem(category.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        {editingItem ? 'Update' : 'Add'} Item
                      </button>
                      <button
                        onClick={resetItemForm}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowItemForm(category.id)}
                    className="w-full p-3 border-2 border-dashed rounded text-gray-500 hover:border-blue-400 hover:text-blue-600"
                  >
                    + Add Item
                  </button>
                )}
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No categories yet. Add one to start building your menu.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
