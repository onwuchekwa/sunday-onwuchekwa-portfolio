/** Firestore document limit is 1 MiB — images are stored as Base64 inside documents. */
export const FIRESTORE_DOC_LIMIT_BYTES = 1_048_576

/** Leave headroom for other fields in the same document. */
export const PROFILE_IMAGE_MAX_BYTES = 350_000
export const NEWS_IMAGE_MAX_BYTES = 400_000
export const PUBLICATION_THUMBNAIL_MAX_BYTES = 250_000

export interface CompressedImage {
  dataUrl: string
  byteSize: number
  encodedByteSize: number
  sourceByteSize: number
  width: number
  height: number
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image file'))
    }
    img.src = url
  })
}

function portraitFaceCrop(
  imgWidth: number,
  imgHeight: number,
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  const size = Math.min(imgWidth, imgHeight)
  const sx = Math.round((imgWidth - size) / 2)

  // Head-and-shoulders portraits: face sits above the vertical midpoint.
  const aspect = imgHeight / imgWidth
  const faceCenterRatio = aspect >= 1.5 ? 0.27 : aspect >= 1.2 ? 0.31 : 0.36
  const faceCenterY = imgHeight * faceCenterRatio

  let sy = Math.round(faceCenterY - size / 2)
  sy = Math.max(0, Math.min(sy, imgHeight - size))

  return { sx, sy, sWidth: size, sHeight: size }
}

function sourceRect(
  img: HTMLImageElement,
  cropMode?: 'none' | 'portrait-face',
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  if (cropMode === 'portrait-face') {
    return portraitFaceCrop(img.width, img.height)
  }
  return { sx: 0, sy: 0, sWidth: img.width, sHeight: img.height }
}

function outputDimensions(
  source: { sWidth: number; sHeight: number },
  maxDimension: number,
  cropMode?: 'none' | 'portrait-face',
): { width: number; height: number } {
  if (cropMode === 'portrait-face') {
    return { width: maxDimension, height: maxDimension }
  }
  return resizeDimensions(source.sWidth, source.sHeight, maxDimension)
}

function resizeDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }
  const ratio = Math.min(maxDimension / width, maxDimension / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed'))),
      'image/jpeg',
      quality,
    )
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not encode image'))
    reader.readAsDataURL(blob)
  })
}

function encodedSize(dataUrl: string): number {
  return new Blob([dataUrl]).size
}

const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])

export async function compressImageToBase64(
  file: File,
  options: {
    maxDimension: number
    maxBytes: number
    cropMode?: 'none' | 'portrait-face'
  },
): Promise<CompressedImage> {
  const type = file.type.toLowerCase()
  if (type && !type.startsWith('image/')) {
    throw new Error('Please select an image file (JPEG, PNG, WebP, etc.)')
  }
  if (HEIC_TYPES.has(type) || /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name)) {
    throw new Error(
      'HEIC/HEIF photos are not supported in the browser. Export as JPEG or PNG first (Photos app → Share → Save as JPEG).',
    )
  }

  const img = await loadImage(file)
  const crop = sourceRect(img, options.cropMode)
  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25]
  const dimensionSteps = [1, 0.85, 0.7, 0.55, 0.4, 0.3]

  for (const dimensionScale of dimensionSteps) {
    const maxDim = Math.max(64, Math.round(options.maxDimension * dimensionScale))
    const { width, height } = outputDimensions(crop, maxDim, options.cropMode)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(img, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, width, height)

    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, quality)
      const dataUrl = await blobToDataUrl(blob)
      const dataUrlSize = encodedSize(dataUrl)
      if (dataUrlSize <= options.maxBytes) {
        return {
          dataUrl,
          byteSize: blob.size,
          encodedByteSize: dataUrlSize,
          sourceByteSize: file.size,
          width,
          height,
        }
      }
    }
  }

  throw new Error(
    `Could not compress below ${Math.round(options.maxBytes / 1024)} KB for Firestore. Try a simpler photo or crop it first.`,
  )
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function estimateDocumentSize(fields: Record<string, unknown>): number {
  return new Blob([JSON.stringify(fields)]).size
}
