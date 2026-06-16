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

console.log(`Using Firebase project: ${serviceAccount.project_id}`)
console.log('Seeding Firestore collections...\n')

const siteSettings = {
  name: 'Sunday O. Onwuchekwa',
  title: 'PhD Student in Computer Science | HCI & Human-Centered Computing Researcher',
  tagline:
    'I investigate how technology shapes human experiences, communities, and spiritual practices. Through qualitative and participatory approaches, I seek to design sociotechnical systems that are inclusive, culturally responsive, and supportive of human flourishing.',
  email: 'sunday.onwuchekwa@byu.edu',
  phone: '',
  websiteUrl: 'https://sunday-onwuchekwa.web.app',
  socialLinks: [
    { platform: 'Google Scholar', url: 'https://scholar.google.com', icon: 'mdi-school' },
    { platform: 'ORCID', url: 'https://orcid.org/0000-0000-0000-0000', icon: 'mdi-identifier' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/in/sunday-onwuchekwa', icon: 'mdi-linkedin' },
  ],
  profileImageUrl: '',
  pageVisibility: {
    about: true,
    publications: true,
    news: true,
    cv: true,
    contact: true,
  },
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
    venue: 'Proceedings of the ACM Conference on Human Factors in Computing Systems',
    year: 2025,
    type: 'paper',
    abstract: 'We present findings from a year-long ethnographic study of how three religious communities integrate digital tools into worship and fellowship.',
    links: { doi: 'https://doi.org/10.1145/example', pdf: '' },
    featured: true,
    includeInCv: true,
    cvOrder: 0,
    cvCategory: 'conference_proceedings',
    cvStatus: 'CHI 2025',
    acceptanceRate: '25.1% acceptance rate',
    scholarNote: '#1 in Google Scholar',
    isJournalModel: false,
    thumbnailUrl: '',
    sourceUrl: 'https://dl.acm.org/doi/10.1145/example',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Prayer Apps and Privacy: A Participatory Design Study',
    authors: 'Sunday Onwuchekwa, Alice Johnson',
    venue: 'Proceedings of the ACM on Human-Computer Interaction',
    year: 2024,
    type: 'poster',
    abstract: 'A participatory design study examining privacy concerns in mobile prayer applications.',
    links: { doi: '', pdf: '' },
    featured: true,
    includeInCv: true,
    cvOrder: 1,
    cvCategory: 'journal_article',
    cvStatus: 'CSCW 2024',
    isJournalModel: true,
    thumbnailUrl: '',
    sourceUrl: '',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Community Privacy Practices in Mobile Worship Apps',
    authors: 'Sunday Onwuchekwa',
    venue: 'Extended Abstracts of the USENIX Symposium on Usable Privacy and Security',
    year: 2023,
    type: 'poster',
    abstract: 'An exploratory study of how worship communities negotiate privacy on mobile platforms.',
    links: { pdf: '', doi: '', arxiv: '' },
    featured: false,
    includeInCv: true,
    cvOrder: 2,
    cvCategory: 'archived_abstract',
    cvStatus: 'SOUPS 2023',
    thumbnailUrl: '',
    sourceUrl: '',
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
  publicationsIntro:
    'In computer science, the top and archival publications are often conference proceedings. The top publications for my field of Human-Computer Interaction are listed on Google Scholar. For example, the highest cited publication is a conference Proceedings of the ACM Conference on Human Factors in Computing Systems (CHI) and the top journal and second most cited publication is the Proceedings of the ACM on Human-Computer Interaction (PACM HCI).',
  sections: [
    {
      id: 'researchInterests',
      title: 'Research Interests',
      visible: true,
      order: 0,
      entries: [
        {
          title: 'Religion & Technology',
          description:
            'Studying how congregations and individuals use (and resist) digital tools in worship, fellowship, and spiritual formation.',
          icon: 'mdi-church',
          visible: true,
        },
        {
          title: 'Participatory Design',
          description:
            'Partnering with faith communities and underserved groups to co-design technologies that reflect their values and practices.',
          icon: 'mdi-account-group',
          visible: true,
        },
        {
          title: 'Human-Centered Computing',
          description:
            'Applying qualitative HCI methods—ethnography, interviews, and field studies—to understand technology in everyday life.',
          icon: 'mdi-heart-pulse',
          visible: true,
        },
      ],
    },
    {
      id: 'education',
      title: 'Education',
      visible: true,
      order: 1,
      entries: [
        {
          degree: 'Ph.D. in Computer Science',
          institution: 'Brigham Young University',
          location: 'Provo, UT',
          year: 'Jun 2028',
          details: 'Focus: HCI, Religion & Technology',
          visible: true,
          showOnAbout: true,
        },
        {
          degree: 'B.S. in Computer Science',
          institution: 'Brigham Young University',
          location: 'Provo, UT',
          year: 'Jun 2022',
          details: 'Minor: Design Thinking',
          visible: true,
          showOnAbout: true,
        },
      ],
    },
    {
      id: 'appointments',
      title: 'Academic Experience',
      visible: true,
      order: 2,
      entries: [
        {
          role: 'Graduate Research Assistant',
          institution: 'Brigham Young University',
          location: 'Provo, UT',
          dates: '2024 – Present',
          details:
            'Studying technology use in faith communities\nMentoring undergraduate researchers on qualitative HCI projects',
          visible: true,
        },
        {
          role: 'Teaching Assistant (CS 601)',
          institution: 'Brigham Young University',
          location: 'Provo, UT',
          dates: 'Sept 2025 – Present',
          details:
            'Led weekly discussion sections and office hours\nGraded assignments and provided feedback to students',
          visible: true,
        },
      ],
    },
    {
      id: 'industryExperience',
      title: 'Industry Experience',
      visible: true,
      order: 3,
      entries: [
        {
          role: 'Customer Service & Data Operations Specialist',
          company: 'Springboard',
          location: 'Remote, USA',
          dates: 'Feb. 2026 – Present',
          details:
            'Handle 30+ inbound and outbound customer inquiries daily\nMaintain accurate records in CRM and support ticketing systems',
          visible: true,
        },
        {
          role: 'Software Engineering Intern',
          company: 'Tech Startup Inc.',
          location: 'Provo, UT',
          dates: 'May 2023 – Aug 2023',
          details:
            'Built internal dashboards with Vue and Firebase\nCollaborated with product team on user-facing feature releases',
          visible: true,
        },
      ],
    },
    {
      id: 'volunteerExperience',
      title: 'Volunteer Experience',
      visible: true,
      order: 4,
      entries: [
        {
          role: 'Youth Mentor',
          company: 'Local Community Center',
          location: 'Provo, UT',
          dates: '2022 – Present',
          details:
            'Mentor high school students in STEM career planning\nOrganize monthly coding workshops and study groups',
          visible: true,
        },
        {
          role: 'Ward Technology Coordinator',
          company: 'The Church of Jesus Christ of Latter-day Saints',
          location: 'Provo, UT',
          dates: '2024 – Present',
          details:
            'Support audiovisual needs for weekly meetings\nTrain volunteers on presentation and streaming tools',
          visible: true,
        },
      ],
    },
    {
      id: 'awards',
      title: 'Honors, Awards, and Fellowships',
      visible: true,
      order: 5,
      entries: [
        {
          title: 'Outstanding Graduate Research Award',
          issuer: 'College of Computing, Brigham Young University',
          year: '2025',
          visible: true,
        },
        {
          title: 'NSF Graduate Research Fellowship (Honorable Mention)',
          issuer: 'National Science Foundation',
          year: '2024',
          visible: true,
        },
      ],
    },
    {
      id: 'service',
      title: 'Academic Service',
      visible: true,
      order: 6,
      entries: [
        {
          role: 'Reviewer',
          organization: 'ACM CSCW 2025',
          dates: '2025',
          visible: true,
        },
        {
          role: 'Poster Session Co-Chair',
          organization: 'ACM CHI 2024',
          dates: '2024',
          visible: true,
        },
      ],
    },
    {
      id: 'invitedEvents',
      title: 'Invited Events',
      visible: true,
      order: 7,
      entries: [
        {
          title: 'Faith Communities and Technology Panel',
          venue: 'BYU HCI Colloquium',
          date: '2025',
          details: 'Invited to discuss religion, technology, and community-centered design.',
          visible: true,
        },
        {
          title: 'Designing for Religious Communities',
          venue: 'Utah UX Meetup',
          date: '2024',
          details: 'Invited talk on participatory design with faith-based organizations.',
          visible: true,
        },
      ],
    },
    {
      id: 'presentations',
      title: 'Presentations & Talks',
      visible: true,
      order: 8,
      entries: [
        {
          title: 'Technology Adoption in Faith Communities',
          venue: 'BYU Graduate Research Symposium',
          date: '2025',
          type: 'Poster',
          visible: true,
        },
        {
          title: 'Community-Centered HCI Methods',
          venue: 'BYU CS Department Seminar',
          date: '2024',
          type: 'Talk',
          visible: true,
        },
      ],
    },
    {
      id: 'grants',
      title: 'Grants & Funding',
      visible: true,
      order: 9,
      entries: [
        {
          title: 'Graduate Research Fellowship',
          funder: 'Brigham Young University',
          amount: '$15,000',
          dates: '2024 – 2025',
          visible: true,
        },
        {
          title: 'Summer Research Grant',
          funder: 'College of Computing',
          amount: '$3,500',
          dates: 'Summer 2024',
          visible: true,
        },
      ],
    },
    {
      id: 'certificates',
      title: 'Certificates',
      visible: false,
      order: 10,
      entries: [
        {
          name: 'CITI Human Subjects Research',
          visible: true,
        },
        {
          name: 'Google UX Design Certificate',
          visible: true,
        },
        {
          name: 'AWS Cloud Practitioner',
          visible: true,
        },
      ],
    },
    {
      id: 'skills',
      title: 'Skills',
      visible: true,
      order: 11,
      entries: [
        {
          category: 'Research Methods',
          items: 'Ethnography, Semi-structured interviews, Thematic analysis, Participatory design',
          visible: true,
        },
        {
          category: 'Technical',
          items: 'Vue, TypeScript, Firebase, Python, R, Qualitative coding (NVivo)',
          visible: true,
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
