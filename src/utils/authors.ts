/**
 * Turn a pasted author list into names. Handles the usual shapes:
 *   "Ada Lovelace, Alan Turing, and Grace Hopper"   (paper bylines)
 *   one name per line, or separated by semicolons
 *   "Lovelace, Ada and Turing, Alan"                  (BibTeX "Last, First and …")
 * Affiliation markers such as trailing digits, *, † are dropped.
 */
export function parseAuthorList(text: string): string[] {
  const clean = (name: string) =>
    name
      .replace(/\s+/g, ' ')
      .replace(/[\d*†‡§¶,]+$/, '')
      .trim()

  const andParts = text.trim().split(/\s+and\s+/i)
  const isBibtex = andParts.length > 1 && andParts.every((part) => (part.match(/,/g) ?? []).length === 1)
  if (isBibtex) {
    return andParts
      .map((part) => {
        const [last, first] = part.split(',')
        return clean(`${first} ${last}`)
      })
      .filter(Boolean)
  }

  return text
    .split(/\r?\n|;|,|&|\band\b/i)
    .map(clean)
    .filter(Boolean)
}

function nameTokens(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Whether `name` is the site owner, allowing for a missing middle initial or a different
 * spelling of the first name's tail ("Sunday Onwuchekwa" matches "Sunday O. Onwuchekwa").
 */
export function isSameAuthor(name: string, owner: string): boolean {
  const a = nameTokens(name)
  const b = nameTokens(owner)
  if (!a.length || !b.length) return false
  return a[a.length - 1] === b[b.length - 1] && a[0][0] === b[0][0]
}
