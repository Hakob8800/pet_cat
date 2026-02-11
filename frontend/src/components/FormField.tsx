import { FieldError } from 'react-hook-form'

interface FormFieldProps {
  label: string
  error?: FieldError
  children: React.ReactNode
  hint?: string
}

export default function FormField({ label, error, children, hint }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 mb-2">{label}</label>
      {children}
      {hint && !error && (
        <p className="text-sm text-gray-500 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error.message}</p>
      )}
    </div>
  )
}
