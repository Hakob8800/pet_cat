import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getItems,
  createItem,
  updateItem,
  deleteItem,
  reorderCategories,
  reorderItems,
} from '../../api/client'
import { categorySchema, menuItemSchema, CategoryFormData, MenuItemFormData } from '../../lib/validations'
import ImageUpload from '../../components/ImageUpload'
import SortableCategory from '../../components/SortableCategory'
import SortableItem from '../../components/SortableItem'

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
  const [editingCategory, setEditingCategory] = useState<number | null>(null)
  const [showItemForm, setShowItemForm] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Category form
  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    reset: resetCategory,
    formState: { errors: categoryErrors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  })

  // Edit category form
  const {
    register: registerEditCategory,
    handleSubmit: handleSubmitEditCategory,
    reset: resetEditCategory,
    formState: { errors: editCategoryErrors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  })

  // Item form
  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    reset: resetItem,
    setValue: setItemValue,
    watch: watchItem,
    formState: { errors: itemErrors },
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
  })

  const itemImageUrl = watchItem('imageUrl')

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

  const handleAddCategory = async (data: CategoryFormData) => {
    await createCategory(Number(restaurantId), {
      name: data.name,
      position: categories.length
    })
    resetCategory()
    loadCategories()
  }

  const handleUpdateCategory = async (catId: number) => {
    handleSubmitEditCategory(async (data) => {
      await updateCategory(catId, { name: data.name })
      setEditingCategory(null)
      loadCategories()
    })()
  }

  const handleDeleteCategory = async (catId: number) => {
    if (!confirm('Delete this category and all its items?')) return
    await deleteCategory(catId)
    loadCategories()
  }

  const resetItemForm = () => {
    resetItem()
    setEditingItem(null)
    setShowItemForm(null)
  }

  const handleAddItem = async (categoryId: number, data: MenuItemFormData) => {
    await createItem(categoryId, {
      name: data.name,
      description: data.description || undefined,
      price: data.price,
      imageUrl: data.imageUrl || undefined,
      available: true,
      position: categories.find(c => c.id === categoryId)?.items?.length || 0
    })
    resetItemForm()
    loadCategories()
  }

  const handleUpdateItemSubmit = async (data: MenuItemFormData) => {
    if (!editingItem) return
    await updateItem(editingItem.id, {
      name: data.name,
      description: data.description || undefined,
      price: data.price,
      imageUrl: data.imageUrl || undefined,
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
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      available: !item.available
    })
    loadCategories()
  }

  const startEditItem = (item: MenuItem, categoryId: number) => {
    setEditingItem(item)
    setItemValue('name', item.name)
    setItemValue('description', item.description || '')
    setItemValue('price', item.price)
    setItemValue('imageUrl', item.imageUrl || '')
    setShowItemForm(categoryId)
  }

  const startEditCategory = (category: Category) => {
    setEditingCategory(category.id)
    resetEditCategory({ name: category.name })
  }

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)

    const newCategories = arrayMove(categories, oldIndex, newIndex)
    setCategories(newCategories)

    // Save to backend
    const items = newCategories.map((cat, index) => ({
      id: cat.id,
      position: index,
    }))
    await reorderCategories(Number(restaurantId), items)
  }

  const handleItemDragEnd = async (categoryId: number, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const category = categories.find(c => c.id === categoryId)
    if (!category?.items) return

    const oldIndex = category.items.findIndex(i => i.id === active.id)
    const newIndex = category.items.findIndex(i => i.id === over.id)

    const newItems = arrayMove(category.items, oldIndex, newIndex)

    // Update local state
    setCategories(categories.map(c =>
      c.id === categoryId ? { ...c, items: newItems } : c
    ))

    // Save to backend
    const items = newItems.map((item, index) => ({
      id: item.id,
      position: index,
    }))
    await reorderItems(categoryId, items)
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
        <form onSubmit={handleSubmitCategory(handleAddCategory)} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder="New category name..."
              {...registerCategory('name')}
              className={`w-full p-2 border rounded ${categoryErrors.name ? 'border-red-500' : ''}`}
            />
            {categoryErrors.name && (
              <p className="text-sm text-red-600 mt-1">{categoryErrors.name.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Category
          </button>
        </form>

        {/* Categories with Drag & Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={categories.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              {categories.map((category) => (
                <SortableCategory key={category.id} id={category.id}>
                  {/* Category Header */}
                  <div className="p-4 border-b flex justify-between items-center">
                    {editingCategory === category.id ? (
                      <div className="flex gap-2 flex-1">
                        <div className="flex-1">
                          <input
                            type="text"
                            {...registerEditCategory('name')}
                            className={`w-full p-2 border rounded ${editCategoryErrors.name ? 'border-red-500' : ''}`}
                          />
                          {editCategoryErrors.name && (
                            <p className="text-sm text-red-600 mt-1">{editCategoryErrors.name.message}</p>
                          )}
                        </div>
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
                            onClick={() => startEditCategory(category)}
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

                  {/* Items with Drag & Drop */}
                  <div className="p-4 space-y-3">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleItemDragEnd(category.id, event)}
                    >
                      <SortableContext
                        items={category.items?.map(i => i.id) || []}
                        strategy={verticalListSortingStrategy}
                      >
                        {category.items?.map((item) => (
                          <SortableItem key={item.id} id={item.id}>
                            <div
                              className={`flex justify-between items-center p-3 rounded border ${
                                !item.available ? 'bg-gray-100 opacity-60' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
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
                          </SortableItem>
                        ))}
                      </SortableContext>
                    </DndContext>

                    {/* Add/Edit Item Form */}
                    {showItemForm === category.id ? (
                      <form
                        onSubmit={handleSubmitItem((data) =>
                          editingItem ? handleUpdateItemSubmit(data) : handleAddItem(category.id, data)
                        )}
                        className="p-4 border rounded bg-gray-50 space-y-3"
                      >
                        <div>
                          <input
                            type="text"
                            placeholder="Item name"
                            {...registerItem('name')}
                            className={`w-full p-2 border rounded ${itemErrors.name ? 'border-red-500' : ''}`}
                          />
                          {itemErrors.name && (
                            <p className="text-sm text-red-600 mt-1">{itemErrors.name.message}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Description (optional)"
                            {...registerItem('description')}
                            className={`w-full p-2 border rounded ${itemErrors.description ? 'border-red-500' : ''}`}
                          />
                          {itemErrors.description && (
                            <p className="text-sm text-red-600 mt-1">{itemErrors.description.message}</p>
                          )}
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="w-32">
                            <input
                              type="number"
                              placeholder="Price"
                              {...registerItem('price', { valueAsNumber: true })}
                              className={`w-full p-2 border rounded ${itemErrors.price ? 'border-red-500' : ''}`}
                              step="0.01"
                              min="0"
                            />
                            {itemErrors.price && (
                              <p className="text-sm text-red-600 mt-1">{itemErrors.price.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Image</label>
                            <ImageUpload
                              value={itemImageUrl || ''}
                              onChange={(url) => setItemValue('imageUrl', url)}
                              error={itemErrors.imageUrl?.message}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            {editingItem ? 'Update' : 'Add'} Item
                          </button>
                          <button
                            type="button"
                            onClick={resetItemForm}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          resetItem()
                          setShowItemForm(category.id)
                        }}
                        className="w-full p-3 border-2 border-dashed rounded text-gray-500 hover:border-blue-400 hover:text-blue-600"
                      >
                        + Add Item
                      </button>
                    )}
                  </div>
                </SortableCategory>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {categories.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No categories yet. Add one to start building your menu.
          </p>
        )}
      </main>
    </div>
  )
}
