import { AxiosError } from 'axios'

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || 'An error occurred'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}
