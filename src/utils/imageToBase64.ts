/** Firestore document limit is 1 MiB — images are stored as Base64 inside documents. */
export const FIRESTORE_DOC_LIMIT_BYTES = 1_048_576

/** Leave headroom for other fields in the same document. */
export const PROFILE_IMAGE_MAX_BYTES = 350_000
export const NEWS_IMAGE_MAX_BYTES = 400_000

export interface CompressedImage {
  dataUrl: string
  byteSize: number
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

export async function compressImageToBase64(
  file: File,
  options: { maxDimension: number; maxBytes: number },
): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file (JPEG, PNG, WebP, etc.)')
  }

  const img = await loadImage(file)
  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35]
  const dimensionSteps = [1, 0.85, 0.7, 0.55]

  for (const dimensionScale of dimensionSteps) {
    const maxDim = Math.round(options.maxDimension * dimensionScale)
    const { width, height } = resizeDimensions(img.width, img.height, maxDim)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(img, 0, 0, width, height)

    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, quality)
      if (blob.size <= options.maxBytes) {
        const dataUrl = await blobToDataUrl(blob)
        return { dataUrl, byteSize: blob.size, width, height }
      }
    }
  }

  throw new Error(
    `Image is too large even after compression. Try a smaller photo (target: under ${Math.round(options.maxBytes / 1024)} KB).`,
  )
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function estimateDocumentSize(fields: Record<string, unknown>): number {
  return new Blob([JSON.stringify(fields)]).size
}
