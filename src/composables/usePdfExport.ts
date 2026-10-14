/**
 * The CV PDF comes from the browser's own print-to-PDF, styled by the print rules in
 * CvView. Unlike a canvas snapshot, the text stays selectable and searchable.
 */
export function usePdfExport() {
  /**
   * Opens the print dialog. The document title becomes the suggested PDF filename, and
   * `footerLabel` is printed at the bottom-left of every page (browsers with @page margin boxes).
   */
  function printAsPdf(filename: string, footerLabel = ''): void {
    const previousTitle = document.title
    const footerStyle = document.createElement('style')
    footerStyle.textContent = footerLabel
      ? `@page { @bottom-left { content: ${JSON.stringify(footerLabel)}; font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif; font-size: 8.5pt; color: #52606d; } }`
      : ''
    const restore = () => {
      document.title = previousTitle
      footerStyle.remove()
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    document.head.appendChild(footerStyle)
    document.title = filename
    window.print()
  }

  function cvFilename(name: string): string {
    return `${name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}_CV`
  }

  return { printAsPdf, cvFilename }
}
