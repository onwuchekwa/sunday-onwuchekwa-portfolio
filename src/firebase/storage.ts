import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseStorage } from './config'

export async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export function uploadPath(category: 'profile' | 'news' | 'media', filename: string): string {
  const timestamp = Date.now()
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `uploads/${category}/${timestamp}_${safeName}`
}
