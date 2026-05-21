import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const register = (email: string, password: string, name: string) =>
  api.post('/auth/register', { email, password, name })

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email })

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword })

// Restaurants
export const getRestaurants = () => api.get('/restaurants')
export const getRestaurant = (id: number) => api.get(`/restaurants/${id}`)
export const createRestaurant = (data: { name: string; slug: string; description?: string; currency?: string }) =>
  api.post('/restaurants', data)
export const updateRestaurant = (id: number, data: { name: string; slug: string; description?: string; currency?: string }) =>
  api.put(`/restaurants/${id}`, data)
export const deleteRestaurant = (id: number) => api.delete(`/restaurants/${id}`)

// Categories
export const getCategories = (restaurantId: number) =>
  api.get(`/restaurants/${restaurantId}/categories`)
export const createCategory = (restaurantId: number, data: { name: string; position?: number }) =>
  api.post(`/restaurants/${restaurantId}/categories`, data)
export const updateCategory = (id: number, data: { name: string; position?: number }) =>
  api.put(`/categories/${id}`, data)
export const deleteCategory = (id: number) => api.delete(`/categories/${id}`)

// Menu Items
export const getItems = (categoryId: number) =>
  api.get(`/categories/${categoryId}/items`)
export const createItem = (categoryId: number, data: {
  name: string; description?: string; price: number; imageUrl?: string; available?: boolean; position?: number
}) => api.post(`/categories/${categoryId}/items`, data)
export const updateItem = (id: number, data: {
  name: string; description?: string; price: number; imageUrl?: string; available?: boolean; position?: number
}) => api.put(`/items/${id}`, data)
export const deleteItem = (id: number) => api.delete(`/items/${id}`)
export const patchItemAvailability = (id: number, available: boolean) =>
  api.patch(`/items/${id}/available`, { available })

// Public Menu
export const getPublicMenu = (slug: string) => api.get(`/menu/${slug}`)

// Reorder
export const reorderCategories = (restaurantId: number, items: { id: number; position: number }[]) =>
  api.put(`/restaurants/${restaurantId}/categories/reorder`, { items })

export const reorderItems = (categoryId: number, items: { id: number; position: number }[]) =>
  api.put(`/categories/${categoryId}/items/reorder`, { items })

// File Upload
export const uploadImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post<{ filename: string; url: string; contentType: string; size: number }>(
    '/files/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
}

// Tables
export const getTables = (restaurantId: number) =>
  api.get(`/restaurants/${restaurantId}/tables`)
export const createTable = (restaurantId: number, data: { number: number; isActive?: boolean }) =>
  api.post(`/restaurants/${restaurantId}/tables`, data)
export const updateTable = (id: number, data: { number?: number; isActive?: boolean }) =>
  api.put(`/tables/${id}`, data)
export const deleteTable = (id: number) => api.delete(`/tables/${id}`)

// Orders (Public)
export const createOrder = (data: { tableId: number; items: { menuItemId: number; quantity: number }[]; notes?: string }) =>
  api.post('/public/orders', data)
export const getOrderStatus = (orderId: number) =>
  api.get(`/public/orders/${orderId}`)

// Orders (Admin)
export const getOrders = (restaurantId: number) =>
  api.get(`/admin/orders?restaurantId=${restaurantId}`)
export const updateOrderStatus = (orderId: number, status: string, restaurantId: number) =>
  api.put(`/admin/orders/${orderId}/status?restaurantId=${restaurantId}`, { status })

// Analytics
export const getAnalytics = (restaurantId: number, days: 7 | 30 = 7) =>
  api.get(`/admin/analytics?restaurantId=${restaurantId}&days=${days}`)

// Waiter call (Public)
export const callWaiter = (tableId: number) =>
  api.post(`/public/tables/${tableId}/call-waiter`)

export default api
