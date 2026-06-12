import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  type DocumentData,
} from 'firebase/firestore'
import { getFirebaseDb } from './config'
import type { About, NewsItem, Publication, SiteSettings } from '@/types/content'
import type { CvDocument } from '@/types/cv'

const db = () => getFirebaseDb()

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const snap = await getDoc(doc(db(), 'siteSettings', 'main'))
  return snap.exists() ? (snap.data() as SiteSettings) : null
}

export async function saveSiteSettings(data: SiteSettings): Promise<void> {
  await setDoc(doc(db(), 'siteSettings', 'main'), data, { merge: true })
}

export async function getAbout(): Promise<About | null> {
  const snap = await getDoc(doc(db(), 'about', 'main'))
  return snap.exists() ? (snap.data() as About) : null
}

export async function saveAbout(data: About): Promise<void> {
  await setDoc(doc(db(), 'about', 'main'), data, { merge: true })
}

export async function getPublications(): Promise<Publication[]> {
  const q = query(collection(db(), 'publications'), orderBy('year', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Publication))
}

export async function addPublication(data: Omit<Publication, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db(), 'publications'), data as DocumentData)
  return ref.id
}

export async function updatePublication(id: string, data: Partial<Publication>): Promise<void> {
  const { id: _id, ...rest } = data
  await updateDoc(doc(db(), 'publications', id), rest)
}

export async function deletePublication(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'publications', id))
}

export async function getNewsItems(): Promise<NewsItem[]> {
  const q = query(collection(db(), 'news'), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NewsItem))
}

export async function addNewsItem(data: Omit<NewsItem, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db(), 'news'), data as DocumentData)
  return ref.id
}

export async function updateNewsItem(id: string, data: Partial<NewsItem>): Promise<void> {
  const { id: _id, ...rest } = data
  await updateDoc(doc(db(), 'news', id), rest)
}

export async function deleteNewsItem(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'news', id))
}

export async function getCvDocument(): Promise<CvDocument | null> {
  const snap = await getDoc(doc(db(), 'cv', 'main'))
  return snap.exists() ? (snap.data() as CvDocument) : null
}

export async function saveCvDocument(data: CvDocument): Promise<void> {
  await setDoc(doc(db(), 'cv', 'main'), {
    ...data,
    lastUpdated: new Date().toISOString(),
  })
}
