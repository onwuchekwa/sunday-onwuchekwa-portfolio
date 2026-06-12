/**
 * One-time seed script. Run after Firebase is configured:
 *   node scripts/seed-firestore.mjs
 *
 * Requires a service account key at ./service-account.json
 * (download from Firebase Console → Project Settings → Service accounts)
 */
import { readFileSync, existsSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const keyPath = './service-account.json'
if (!existsSync(keyPath)) {
  console.error('Missing service-account.json. See SETUP.md for instructions.')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const siteSettings = {
  name: 'Sunday Onwuchekwa',
  title: 'PhD Student, Computer Science',
  tagline: 'Human-Computer Interaction · Religion & Technology',
  email: 'sunday.onwuchekwa@example.edu',
  socialLinks: [
    { platform: 'Google Scholar', url: 'https://scholar.google.com', icon: 'mdi-school' },
    { platform: 'ORCID', url: 'https://orcid.org/0000-0000-0000-0000', icon: 'mdi-identifier' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/in/sunday-onwuchekwa', icon: 'mdi-linkedin' },
  ],
  profileImageUrl: '',
}

const about = {
  bio: `I am a PhD student in Computer Science with research interests in Human-Computer Interaction and Human-Centered Computing. My work explores the intersection of religion and technology—how faith communities adopt, adapt, and resist digital tools, and how we can design technologies that honor diverse spiritual practices.

I draw on qualitative methods including ethnography, interviews, and participatory design to center the voices of communities often overlooked in technology design.`,
  researchInterests: [
    'Religion & Technology',
    'Human-Computer Interaction',
    'Participatory Design',
    'Digital Spirituality',
    'Community-Centered Computing',
  ],
  education: [
    {
      degree: 'Ph.D. in Computer Science',
      institution: 'Brigham Young University',
      year: '2024 – Present',
      details: 'Focus: HCI, Human-Centered Computing',
    },
    {
      degree: 'M.S. in Computer Science',
      institution: 'Example University',
      year: '2020 – 2022',
      details: '',
    },
  ],
}

const publications = [
  {
    title: 'Designing for Faith: Technology Adoption in Religious Communities',
    authors: 'Sunday Onwuchekwa, Jane Smith, John Doe',
    venue: 'Proceedings of CHI 2025',
    year: 2025,
    type: 'paper',
    abstract: 'We present findings from a year-long ethnographic study of how three religious communities integrate digital tools into worship and fellowship.',
    links: { doi: 'https://doi.org/10.1145/example', pdf: '' },
    featured: true,
    includeInCv: true,
    cvOrder: 0,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Prayer Apps and Privacy: A Participatory Design Study',
    authors: 'Sunday Onwuchekwa, Alice Johnson',
    venue: 'CSCW 2024 Poster',
    year: 2024,
    type: 'poster',
    abstract: 'A participatory design study examining privacy concerns in mobile prayer applications.',
    links: { doi: '', pdf: '' },
    featured: true,
    includeInCv: true,
    cvOrder: 1,
    createdAt: new Date().toISOString(),
  },
]

const news = [
  {
    title: 'Paper accepted to CHI 2025',
    body: 'Our paper on technology adoption in religious communities has been accepted to CHI 2025. Looking forward to presenting in Yokohama!',
    date: '2025-01-15',
    imageUrl: '',
    published: true,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Started PhD at BYU',
    body: 'Excited to begin my PhD journey in Computer Science, focusing on HCI and the intersection of religion and technology.',
    date: '2024-09-01',
    imageUrl: '',
    published: true,
    createdAt: new Date().toISOString(),
  },
]

const cv = {
  sections: [
    {
      id: 'education',
      title: 'Education',
      visible: true,
      order: 0,
      entries: [
        {
          degree: 'Ph.D. in Computer Science',
          institution: 'Brigham Young University',
          year: '2024 – Present',
          details: 'Advisors: TBD. Focus: HCI, Religion & Technology',
        },
        {
          degree: 'M.S. in Computer Science',
          institution: 'Example University',
          year: '2020 – 2022',
          details: '',
        },
      ],
    },
    {
      id: 'researchInterests',
      title: 'Research Interests',
      visible: true,
      order: 1,
      entries: [
        { text: 'Religion & Technology' },
        { text: 'Human-Computer Interaction' },
        { text: 'Participatory & Community-Centered Design' },
      ],
    },
    {
      id: 'appointments',
      title: 'Academic Appointments',
      visible: true,
      order: 2,
      entries: [
        {
          role: 'Graduate Research Assistant',
          institution: 'HCI Lab, Brigham Young University',
          dates: '2024 – Present',
          details: 'Studying technology use in faith communities',
        },
      ],
    },
    {
      id: 'presentations',
      title: 'Presentations & Talks',
      visible: false,
      order: 3,
      entries: [],
    },
    {
      id: 'grants',
      title: 'Grants & Funding',
      visible: false,
      order: 4,
      entries: [],
    },
    {
      id: 'teaching',
      title: 'Teaching',
      visible: false,
      order: 5,
      entries: [],
    },
    {
      id: 'service',
      title: 'Academic Service',
      visible: false,
      order: 6,
      entries: [],
    },
    {
      id: 'awards',
      title: 'Awards & Honors',
      visible: false,
      order: 7,
      entries: [],
    },
    {
      id: 'skills',
      title: 'Skills',
      visible: true,
      order: 8,
      entries: [
        {
          category: 'Research Methods',
          items: 'Ethnography, Semi-structured interviews, Thematic analysis, Participatory design',
        },
        {
          category: 'Technical',
          items: 'Vue.js, TypeScript, Python, Qualitative data analysis',
        },
      ],
    },
  ],
  lastUpdated: new Date().toISOString(),
}

async function seed() {
  console.log('Seeding Firestore...')

  await db.collection('siteSettings').doc('main').set(siteSettings)
  console.log('  ✓ siteSettings/main')

  await db.collection('about').doc('main').set(about)
  console.log('  ✓ about/main')

  for (const pub of publications) {
    const ref = await db.collection('publications').add(pub)
    console.log(`  ✓ publications/${ref.id}`)
  }

  for (const item of news) {
    const ref = await db.collection('news').add(item)
    console.log(`  ✓ news/${ref.id}`)
  }

  await db.collection('cv').doc('main').set(cv)
  console.log('  ✓ cv/main')

  console.log('\nDone! Your portfolio is ready with starter content.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
