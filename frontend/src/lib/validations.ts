import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const restaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers and hyphens'),
  description: z.string().max(500, 'Description too long').optional(),
  currency: z.string().max(5, 'Currency symbol too long').optional(),
})

export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
})

export const menuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  price: z
    .number({ error: 'Price is required' })
    .positive('Price must be greater than 0'),
  imageUrl: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type RestaurantFormData = z.infer<typeof restaurantSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
export type MenuItemFormData = z.infer<typeof menuItemSchema>
