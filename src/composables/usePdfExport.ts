import { ref } from 'vue'

export function usePdfExport() {
  const exporting = ref(false)

  async function exportElement(
    element: HTMLElement,
    filename: string,
  ): Promise<void> {
    exporting.value = true
    try {
      const { default: html2pdf } = await import('html2pdf.js')
      await html2pdf()
        .set({
          margin: [0.6, 0.6, 0.6, 0.6],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        })
        .from(element)
        .save()
    } finally {
      exporting.value = false
    }
  }

  function cvFilename(name: string): string {
    const safe = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
    return `${safe}_CV.pdf`
  }

  return { exporting, exportElement, cvFilename }
}
