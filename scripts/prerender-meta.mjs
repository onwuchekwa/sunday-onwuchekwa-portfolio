/**
 * Post-build: write a copy of dist/index.html per public page and per published news post,
 * with that page's title, description, image, and URL in the <head>. Also adds Person
 * structured data (JSON-LD) to every page and writes dist/sitemap.xml.
 *
 * Link-preview bots (LinkedIn, Slack, iMessage, X, …) don't run JavaScript, so without this
 * every shared URL previews as the home page. With `cleanUrls` in firebase.json, Hosting serves
 * dist/news/<id>.html for /news/<id> before falling back to the SPA rewrite.
 *
 * Reads public Firestore data over REST (rules allow public reads). If Firestore can't be
 * reached, it warns and leaves the build as-is rather than failing the deploy.
 *
 *   node scripts/prerender-meta.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SITE = 'https://sundayonwuchekwa.com'
const DIST = 'dist'
const DEFAULT_IMAGE = `${SITE}/og-image.png`

loadDotEnv('.env')
const projectId = process.env.VITE_FIREBASE_PROJECT_ID
const apiKey = process.env.VITE_FIREBASE_API_KEY

let template = readFileSync(join(DIST, 'index.html'), 'utf8')

try {
  if (!projectId || !apiKey) throw new Error('VITE_FIREBASE_PROJECT_ID / VITE_FIREBASE_API_KEY not set')

  const settings = (await getDoc('siteSettings/main')) ?? {}
  const name = settings.name || 'Sunday O. Onwuchekwa'
  const pageVisibility = settings.pageVisibility ?? {}
  const news = (await listDocs('news')).filter((item) => item.published)
  const cv = (await getDoc('cv/main')) ?? {}

  // Every page carries the Person data, so the template gets it before the copies are made.
  template = template.replace('</head>', `${personJsonLd(settings, name, cv)}\n  </head>`)
  writeFileSync(join(DIST, 'index.html'), template)

  const pages = [
    {
      path: '/publications',
      page: 'publications',
      title: `Publications | ${name}`,
      description: `Papers, posters, and workshop papers by ${name}, grouped by year and type.`,
    },
    {
      path: '/news',
      page: 'news',
      title: `News | ${name}`,
      description: `Paper acceptances, talks, awards, and research milestones from ${name}.`,
    },
    {
      path: '/cv',
      page: 'cv',
      title: `Curriculum Vitae | ${name}`,
      description: `Curriculum vitae of ${name}: education, publications, experience, and service.`,
    },
  ].filter((p) => pageVisibility[p.page] !== false)

  if (pageVisibility.news !== false) {
    for (const item of news) {
      pages.push({
        path: `/news/${item.id}`,
        title: `${item.title} | ${name}`,
        description: summarize(item.body) || `News from ${name}.`,
        image: publishImage(item.imageUrl, `news-${item.id}`),
        type: 'article',
        lastmod: item.date,
      })
    }
  }

  for (const page of pages) {
    const file = join(DIST, `${page.path.slice(1)}.html`)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, renderHead(template, page))
  }
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap([{ path: '/' }, ...pages]))
  console.log(`prerender-meta: wrote preview tags for ${pages.length} pages and a sitemap`)
} catch (error) {
  console.warn(`prerender-meta: skipped (${error instanceof Error ? error.message : error})`)
}

/** Replace the page-specific tags in the built index.html. */
function renderHead(html, { path, title, description, image = DEFAULT_IMAGE, type = 'website' }) {
  const url = `${SITE}${path}`
  const set = (pattern, value) => {
    html = html.replace(pattern, (_, before, after) => `${before}${escapeAttr(value)}${after}`)
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(title)}</title>`)
  set(/(<link rel="canonical" href=")[^"]*(")/, url)
  set(/(<meta name="description" content=")[^"]*(")/, description)
  set(/(<meta property="og:type" content=")[^"]*(")/, type)
  set(/(<meta property="og:title" content=")[^"]*(")/, title)
  set(/(<meta property="og:description" content=")[^"]*(")/, description)
  set(/(<meta property="og:url" content=")[^"]*(")/, url)
  set(/(<meta property="og:image" content=")[^"]*(")/, image)
  set(/(<meta property="og:image:alt" content=")[^"]*(")/, title)
  set(/(<meta name="twitter:title" content=")[^"]*(")/, title)
  set(/(<meta name="twitter:description" content=")[^"]*(")/, description)
  set(/(<meta name="twitter:image" content=")[^"]*(")/, image)
  if (image !== DEFAULT_IMAGE) {
    // Size/type describe the default 1200×630 PNG only.
    html = html.replace(/\s*<meta property="og:image:(?:type|width|height)" content="[^"]*" \/>/g, '')
  }
  return html
}

/**
 * Images are stored inline as data URLs, which previews and crawlers can't use, so they are
 * written out as files under /og/. External image URLs are used as-is.
 */
function publishImage(imageUrl, basename, fallback = DEFAULT_IMAGE) {
  const src = imageUrl?.trim()
  if (!src) return fallback
  if (/^https?:\/\//i.test(src)) return src
  const match = src.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i)
  if (!match) return fallback
  const ext = match[1].toLowerCase().replace('jpeg', 'jpg')
  const file = join(DIST, 'og', `${basename}.${ext}`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, Buffer.from(match[2], 'base64'))
  return `${SITE}/og/${basename}.${ext}`
}

/** schema.org Person, so search engines can tie this site to the same person's other profiles. */
function personJsonLd(settings, name, cv) {
  const interests = (cv.sections ?? [])
    .find((section) => section.id === 'researchInterests')
    ?.entries?.filter((entry) => entry.visible !== false)
    .map((entry) => String(entry.title ?? entry.text ?? '').trim())
    .filter(Boolean)
  // The site title reads like "PhD Student in Computer Science | HCI Researcher | …"; its first part is the role.
  const jobTitle = settings.title?.split('|')[0].trim()
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE}/#person`,
    name,
    url: `${SITE}/`,
    image: publishImage(settings.profileImageUrl, 'profile', null) ?? undefined,
    jobTitle: jobTitle || undefined,
    description: settings.tagline || undefined,
    email: settings.email ? `mailto:${settings.email}` : undefined,
    affiliation: settings.affiliation
      ? { '@type': 'CollegeOrUniversity', name: settings.affiliation }
      : undefined,
    address: settings.location
      ? { '@type': 'PostalAddress', addressLocality: settings.location }
      : undefined,
    knowsAbout: interests?.length ? interests : undefined,
    sameAs: (settings.socialLinks ?? []).map((link) => link.url?.trim()).filter((url) => /^https?:\/\//i.test(url ?? '')),
  }
  // `<` is escaped so no string in the data can close the script element.
  const json = JSON.stringify(person).replace(/</g, '\\u003c')
  return `  <script type="application/ld+json">${json}</script>`
}

function sitemap(pages) {
  const urls = pages.map(({ path, lastmod }) => {
    const date = /^\d{4}-\d{2}-\d{2}/.exec(lastmod ?? '')?.[0]
    return `  <url><loc>${escapeText(SITE + path)}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

/** First sentence of the first paragraph, with the news Markdown subset stripped. */
function summarize(body = '') {
  const paragraph =
    body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !/^#{2,3}\s/.test(p)) ?? ''
  const text = paragraph
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<![\w*])[*_](\S.*?\S|\S)[*_](?![\w*])/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
  const sentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text
  return sentence.length <= 200 ? sentence : `${sentence.slice(0, 200).replace(/\s+\S*$/, '')}…`
}

// ---- Firestore REST (public reads) ----

function BASE() {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
}

async function getDoc(path) {
  const res = await fetch(`${BASE()}/${path}?key=${apiKey}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Firestore ${path}: HTTP ${res.status}`)
  return decodeDoc(await res.json())
}

async function listDocs(collection) {
  const docs = []
  let pageToken = ''
  do {
    const res = await fetch(
      `${BASE()}/${collection}?key=${apiKey}&pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`,
    )
    if (!res.ok) throw new Error(`Firestore ${collection}: HTTP ${res.status}`)
    const json = await res.json()
    docs.push(...(json.documents ?? []).map(decodeDoc))
    pageToken = json.nextPageToken ?? ''
  } while (pageToken)
  return docs
}

function decodeDoc(doc) {
  return { id: doc.name.split('/').pop(), ...decodeFields(doc.fields ?? {}) }
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]))
}

function decodeValue(value) {
  if ('stringValue' in value) return value.stringValue
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('timestampValue' in value) return value.timestampValue
  if ('nullValue' in value) return null
  if ('mapValue' in value) return decodeFields(value.mapValue.fields ?? {})
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decodeValue)
  return undefined
}

// ---- helpers ----

function escapeAttr(text) {
  return String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeText(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Local builds read .env; CI passes the same variables in the environment. */
function loadDotEnv(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
}
