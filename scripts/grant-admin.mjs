/**
 * Grant the Firestore admin custom claim to a Firebase Auth user.
 *
 *   node scripts/grant-admin.mjs you@example.com
 *
 * Requires a service account key at ./service-account.json
 * (download from Firebase Console → Project Settings → Service accounts).
 *
 * The user must sign out and back in for the claim to take effect.
 */
import { readFileSync, existsSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/grant-admin.mjs <email>')
  process.exit(1)
}

const keyPath = './service-account.json'
if (!existsSync(keyPath)) {
  console.error('Missing service-account.json. See SETUP.md for instructions.')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })

console.log(`Using Firebase project: ${serviceAccount.project_id}`)

try {
  const auth = getAuth()
  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true })
  console.log(`Granted admin claim to ${email} (uid: ${user.uid})`)
  console.log('Sign out and back in on the site for the claim to take effect.')
} catch (e) {
  console.error(`Failed to grant admin claim: ${e.message}`)
  process.exit(1)
}
