import { useState, useRef } from 'react'
import { uploadImage } from '../api/client'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  error?: string
}

export default function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const response = await uploadImage(file)
      onChange(response.data.url)
    } catch (err) {
      setUploadError('Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Uploaded"
            className="w-24 h-24 object-cover rounded border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
          >
            x
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`w-24 h-24 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-blue-400 ${
            error || uploadError ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          {uploading ? (
            <span className="text-gray-400 text-sm">Uploading...</span>
          ) : (
            <span className="text-gray-400 text-2xl">+</span>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {(error || uploadError) && (
        <p className="text-sm text-red-600">{error || uploadError}</p>
      )}
    </div>
  )
}
