/**
 * Post-build, after prerender-meta: open each built page in headless Chrome, let the app load
 * its content from Firestore, and save the rendered markup into that page's HTML file.
 *
 * Visitors then see the page as soon as the HTML and CSS arrive instead of a blank screen, and
 * crawlers that don't run JavaScript can read it. The app mounts hidden behind the snapshot and
 * takes over once its own (live) data has loaded; see src/utils/contentReady.ts.
 *
 * dist/app.html keeps the empty shell for URLs without a snapshot (Hosting rewrites to it).
 * Uses the installed Chrome or Edge (or CHROME_PATH). Without one, or if a page fails to load,
 * it warns and leaves those pages as plain shells rather than failing the deploy.
 *
 *   node scripts/prerender-content.mjs
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, relative, sep } from 'node:path'

const DIST = 'dist'
const SHELL = 'app.html'
const APP_DIV = '<div id="app"></div>'

const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf8')
if (indexHtml.includes('id="prerendered"')) {
  console.error('prerender-content: dist already has snapshots; run the full build again')
  process.exit(1)
}
writeFileSync(join(DIST, SHELL), indexHtml)

const pages = listPages()
const server = await startServer()
let browser

try {
  const executablePath = findChrome()
  if (!executablePath) throw new Error('no Chrome or Edge found; set CHROME_PATH')

  const { default: puppeteer } = await import('puppeteer-core')
  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: process.platform === 'linux' ? ['--no-sandbox'] : [],
  })
  const origin = `http://127.0.0.1:${server.address().port}`
  let written = 0

  for (const { file, path } of pages) {
    try {
      const snapshot = await capture(browser, origin + path)
      writeFileSync(file, inject(readFileSync(file, 'utf8'), snapshot))
      written++
    } catch (error) {
      console.warn(`prerender-content: skipped ${path} (${error instanceof Error ? error.message : error})`)
    }
  }
  console.log(`prerender-content: wrote content snapshots for ${written} of ${pages.length} pages`)
} catch (error) {
  console.warn(`prerender-content: skipped (${error instanceof Error ? error.message : error})`)
} finally {
  await browser?.close()
  server.close()
}

/** Render one page and return its app markup plus the styles the app added to <head>. */
async function capture(browser, url) {
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 1280, height: 900 })
    await page.goto(url, { waitUntil: 'load', timeout: 30000 })
    await page.waitForFunction(() => document.documentElement.dataset.appReady, { timeout: 20000 })
    const state = await page.evaluate(() => document.documentElement.dataset.appReady)
    if (state !== 'settled') throw new Error('content did not finish loading')
    await page.evaluate(() => document.fonts.ready)

    return await page.evaluate(() => ({
      body: document.getElementById('app').innerHTML,
      headStyles: [...document.head.querySelectorAll('style, link[rel="stylesheet"]')].map((el) => el.outerHTML),
    }))
  } finally {
    await page.close()
  }
}

function inject(html, { body, headStyles }) {
  // Skip stylesheets the page already links (attribute order and quoting differ from the source).
  const added = headStyles.filter((tag) => {
    const href = tag.match(/^<link[^>]*\shref="([^"]+)"/)?.[1]
    return href ? !html.includes(href) : !html.includes(tag)
  })
  const head = [
    ...added,
    // The live app renders here hidden until it has its data, then removes the snapshot.
    '<style id="prerender-style">#app{position:absolute;top:0;left:0;width:100%;visibility:hidden}</style>',
  ]
  const snapshot = [
    `<div id="prerendered">${externalizeImages(body)}</div>`,
    // The admin host serves these same files; it should never show the public snapshot.
    `<script>if(location.hostname.startsWith('admin.')){document.getElementById('prerendered').remove();document.getElementById('prerender-style').remove()}</script>`,
    APP_DIV,
  ]
  if (!html.includes(APP_DIV)) throw new Error('no app element in page')
  return html.replace('</head>', `${head.join('\n')}\n  </head>`).replace(APP_DIV, snapshot.join('\n    '))
}

/** Inline images (the profile photo is stored as a data URL) become shared files, not per-page copies. */
function externalizeImages(html) {
  return html.replace(/data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)/g, (_, type, data) => {
    const ext = type.toLowerCase().replace('jpeg', 'jpg')
    const name = `inline-${createHash('sha1').update(data).digest('hex').slice(0, 12)}.${ext}`
    const file = join(DIST, 'og', name)
    if (!existsSync(file)) {
      mkdirSync(join(DIST, 'og'), { recursive: true })
      writeFileSync(file, Buffer.from(data, 'base64'))
    }
    return `/og/${name}`
  })
}

/** index.html plus every page prerender-meta wrote (e.g. dist/news/<id>.html → /news/<id>). */
function listPages() {
  const found = [{ file: join(DIST, 'index.html'), path: '/' }]
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const file = join(dir, name)
      if (statSync(file).isDirectory()) {
        if (name !== 'assets' && name !== 'og' && name !== 'files') walk(file)
      } else if (extname(name) === '.html' && file !== join(DIST, 'index.html') && file !== join(DIST, SHELL)) {
        found.push({ file, path: `/${relative(DIST, file).split(sep).join('/').replace(/\.html$/, '')}` })
      }
    }
  }
  walk(DIST)
  return found
}

/** Serves dist like Hosting: existing files as-is, anything else gets the empty shell. */
function startServer() {
  const types = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
    '.woff': 'font/woff', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject', '.pdf': 'application/pdf',
  }
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    const candidate = join(DIST, pathname)
    const isAsset = pathname !== '/' && existsSync(candidate) && statSync(candidate).isFile()
    const file = isAsset ? candidate : join(DIST, SHELL)
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)))
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ]
  return candidates.find((path) => path && existsSync(path))
}
