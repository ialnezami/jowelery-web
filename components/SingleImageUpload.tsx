'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'

interface SingleImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  folder?: string
  label?: string
}

export function SingleImageUpload({ value, onChange, folder = 'jowelery', label }: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', files[0])
      formData.append('folder', folder)

      const token = typeof window !== 'undefined' ? (window as any).__JWT : undefined
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
      if (url) {
        onChange(url)
        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  const handleClick = () => {
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
      )}
      <div className="flex items-center gap-4">
        {value ? (
          <div
            className="relative group cursor-pointer"
            onClick={handleClick}
          >
            <div className="w-32 h-32 sm:w-40 sm:h-40 relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-amber-500 transition-colors">
              <Image
                src={value}
                alt="Upload"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-8 w-8 text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">Click to change</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="w-32 h-32 sm:w-40 sm:h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50 cursor-pointer"
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
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
