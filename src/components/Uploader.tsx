'use client'

import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileIcon, X, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface UploaderProps {
  onFilesSelected: (files: File[]) => void
  isLoading: boolean
}

export default function Uploader({ onFilesSelected, isLoading }: UploaderProps) {
  const [previews, setPreviews] = useState<{ name: string, data?: string }[]>([])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf']
    },
    onDrop: (acceptedFiles) => {
      onFilesSelected(acceptedFiles)
      setPreviews(acceptedFiles.map(f => ({ name: f.name })))
    },
    disabled: isLoading
  })

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`group relative mt-2 flex justify-center rounded-2xl border-2 border-dashed px-6 py-12 transition-all duration-300 ease-in-out cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50/10' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/10'}
          ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <div className="flex justify-center transition-transform duration-300 group-hover:-translate-y-1">
            <UploadCloud className={`h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          <div className="mt-4 flex text-sm leading-6 text-gray-400">
            <p className="pl-1">
              <span className="font-semibold text-blue-500 hover:text-blue-400">Upload medical files</span> or drag and drop
            </p>
          </div>
          <p className="text-xs leading-5 text-gray-500">PNG, JPG, PDF up to 10MB</p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {previews.map((file, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-100/10 px-3 py-2 text-sm text-gray-400 border border-gray-200/20">
              <FileIcon className="h-4 w-4 text-blue-500" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              {!isLoading && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviews(prev => prev.filter((_, idx) => idx !== i))
                  }}
                  className="hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
