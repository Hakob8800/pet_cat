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

// Restaurants
export const getRestaurants = () => api.get('/restaurants')
export const createRestaurant = (data: { name: string; slug: string; description?: string }) =>
  api.post('/restaurants', data)
export const updateRestaurant = (id: number, data: { name: string; slug: string; description?: string }) =>
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

export default api
