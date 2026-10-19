/**
 * Make a publication thumbnail from a page of its PDF, entirely in the browser.
 *
 * pdf.js is loaded only when this is used. A PDF can come from a file the user picks, or
 * from a link on this site (e.g. /files/poster.pdf); other sites' PDFs usually can't be read
 * from the browser, so for those the user downloads the PDF and picks the file.
 */
import { compressImageToBase64 } from '@/utils/imageToBase64'
import { publicSiteOrigin } from '@/utils/hosts'

export type PdfCrop = 'top' | 'full'

/** A same-site URL the admin can fetch, or null when the PDF lives on another site. */
export function readablePdfUrl(link: string): string | null {
  const url = link.trim()
  if (!url) return null
  try {
    const parsed = new URL(url, publicSiteOrigin)
    // The admin host serves the same files as the public site.
    if (parsed.origin === publicSiteOrigin || parsed.origin === location.origin) {
      return `${location.origin}${parsed.pathname}`
    }
  } catch {
    return null
  }
  return null
}

export async function pdfPageToThumbnail(
  source: File | string,
  options: { page: number; crop: PdfCrop; maxDimension: number; maxBytes: number },
): Promise<{ dataUrl: string; pageCount: number }> {
  const pdfjs = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const data = typeof source === 'string' ? await fetchPdf(source) : new Uint8Array(await source.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  try {
    const pageNumber = Math.min(Math.max(1, Math.round(options.page)), pdf.numPages)
    const page = await pdf.getPage(pageNumber)

    // Render about twice the final size so the downscale stays sharp.
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: (options.maxDimension * 2) / base.width })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    await page.render({ canvas, viewport }).promise

    // "Top" keeps the upper part of the page: the title, and usually the teaser figure.
    const height = options.crop === 'top' ? Math.round(canvas.width * 0.66) : canvas.height
    const out = document.createElement('canvas')
    out.width = canvas.width
    out.height = Math.min(height, canvas.height)
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(canvas, 0, 0)

    const blob = await new Promise<Blob>((resolve, reject) =>
      out.toBlob((b) => (b ? resolve(b) : reject(new Error('Couldn’t create the image.'))), 'image/png'),
    )
    const compressed = await compressImageToBase64(new File([blob], 'thumbnail.png', { type: 'image/png' }), {
      maxDimension: options.maxDimension,
      maxBytes: options.maxBytes,
    })
    return { dataUrl: compressed.dataUrl, pageCount: pdf.numPages }
  } finally {
    await pdf.destroy()
  }
}

async function fetchPdf(url: string): Promise<Uint8Array> {
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Couldn’t download the PDF. Download it and choose the file instead.')
  }
  if (!response.ok) throw new Error(`Couldn’t download the PDF (${response.status}). Choose the file instead.`)
  return new Uint8Array(await response.arrayBuffer())
}
