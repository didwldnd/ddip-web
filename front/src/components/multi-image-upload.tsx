"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/src/components/ui/button"
import { X, Upload, GripVertical } from "lucide-react"

interface MultiImageUploadProps {
  value?: File[]
  onChange?: (files: File[]) => void
  maxImages?: number
  className?: string
}

export function MultiImageUpload({
  value = [],
  onChange,
  maxImages = 3,
  className,
}: MultiImageUploadProps) {
  const [images, setImages] = useState<File[]>(value)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      alert("이미지 파일만 업로드 가능합니다")
      return
    }

    const remainingSlots = maxImages - images.length
    if (imageFiles.length > remainingSlots) {
      alert(`최대 ${maxImages}장까지 업로드 가능합니다. ${remainingSlots}장만 추가됩니다.`)
      imageFiles.splice(remainingSlots)
    }

    const newImages = [...images, ...imageFiles]
    setImages(newImages)
    onChange?.(newImages)

    // input 초기화 (같은 파일 다시 선택 가능하도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onChange?.(newImages)
  }

  const handleAddMore = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      {images.length === 0 ? (
        // 이미지가 없을 때: 큰 업로드 영역만 표시
        <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-muted">
          <div className="flex flex-col items-center gap-2">
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">이미지를 업로드하세요 (최대 {maxImages}장)</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMore}
            >
              파일 선택
            </Button>
          </div>
        </div>
      ) : (
        // 이미지가 있을 때: 그리드 레이아웃으로 표시
        <div className="grid grid-cols-3 gap-4">
          {images.map((image, index) => {
            const previewUrl = URL.createObjectURL(image)
            return (
              <div
                key={index}
                className="group relative aspect-video overflow-hidden rounded-lg border bg-muted"
              >
                <Image
                  src={previewUrl}
                  alt={`이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleRemove(index)}
                >
                  <X className="size-4" />
                </Button>
                <div className="absolute left-2 top-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                  {index + 1}
                </div>
              </div>
            )
          })}

          {images.length < maxImages && (
            <div
              className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border border-dashed bg-muted transition-colors hover:bg-muted/80"
              onClick={handleAddMore}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  이미지 추가 ({images.length}/{maxImages})
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
