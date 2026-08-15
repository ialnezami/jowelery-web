'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  folder?: string
}

export function ImageUpload({ value = [], onChange, maxImages = 5, folder = 'jowelery' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Sync previewUrls with value prop
  const previewUrls = value

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (value.length + files.length > maxImages) {
      toast({
        variant: 'destructive',
        title: 'Maximum Images Reached',
        description: `Maximum ${maxImages} images allowed`,
      })
      return
    }

    setUploading(true)

    try {
      const token = typeof window !== 'undefined' ? (window as any).__JWT : undefined
      const urls: string[] = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const response = await fetch(`${B}/upload/image`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Upload failed')
        }

        const url = data.url ?? data.data?.url
        if (url) urls.push(url)
      }

      const newUrls = [...value, ...urls]
      onChange(newUrls)
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload images. Please try again.',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        {previewUrls.map((url, index) => (
          <div key={index} className="relative group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 relative rounded-lg overflow-hidden border-2 border-gray-200">
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {previewUrls.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Upload</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-sm text-gray-500">
        {previewUrls.length} / {maxImages} images uploaded
      </p>
    </div>
  )
}
