# Sunday Onwuchekwa Portfolio — Setup Guide

This guide walks you through creating your Firebase project, configuring the app, seeding starter content, and deploying to Firebase Hosting.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- A [Google account](https://accounts.google.com/) for Firebase
- A [GitHub account](https://github.com/) for code hosting and CI/CD (optional but recommended)

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Name it `sunday-onwuchekwa-portfolio` (or your preferred name)
4. Disable Google Analytics if you don't need it (optional for a portfolio)
5. Click **Create project**

### Enable Firebase services

In your new project:

| Service | How to enable |
|---------|---------------|
| **Firestore** | Build → Firestore Database → Create database → Start in **production mode** → choose a region |
| **Storage** | Build → Storage → Get started → Start in production mode |
| **Authentication** | Build → Authentication → Get started → Enable **Email/Password** sign-in |
| **Hosting** | Build → Hosting → Get started (you'll deploy later) |

### Register your web app

1. Project Overview → click the **Web** icon (`</>`)
2. App nickname: `portfolio-web`
3. Click **Register app**
4. Copy the `firebaseConfig` values — you'll need them in Step 2

---

## Step 2: Configure Environment Variables

In the project root:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase config values:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=sunday-onwuchekwa-portfolio.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sunday-onwuchekwa-portfolio
VITE_FIREBASE_STORAGE_BUCKET=sunday-onwuchekwa-portfolio.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## Step 3: Create Your Admin Account

1. Firebase Console → **Authentication** → **Users**
2. Click **Add user**
3. Enter your email and a strong password
4. This is the account you'll use to log in at `/admin/login`

---

## Step 4: Deploy Security Rules

Install the Firebase CLI (one time):

```bash
npm install -g firebase-tools
firebase login
```

From the project root:

```bash
firebase use --add
# Select your project and give it alias "default"

firebase deploy --only firestore:rules,storage
```

This deploys:
- **Firestore rules**: public read, authenticated write
- **Storage rules**: public read for `/uploads/**`, authenticated write

---

## Step 5: Install Dependencies and Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) for the public site.

Open [http://localhost:5173/admin/login](http://localhost:5173/admin/login) to access the admin panel.

> **Note:** Until you seed content (Step 6), pages will show placeholder or empty states.

---

## Step 6: Seed Starter Content

1. Firebase Console → **Project Settings** → **Service accounts**
2. Click **Generate new private key** → save as `service-account.json` in the project root
3. Run:

```bash
npm run seed
```

This populates Firestore with:
- Site settings (your name, tagline, social links)
- About page bio and research interests
- 2 sample publications
- 2 sample news posts
- Starter CV sections

> **Important:** `service-account.json` is gitignored. Never commit it.

After seeding, refresh the site — content should appear immediately.

---

## Step 7: Deploy to Firebase Hosting

### First deploy (manual)

```bash
npm run build
firebase deploy --only hosting
```

Your site will be live at `https://your-project-id.web.app`.

### Automated deploys via GitHub Actions

See **[GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md)** for the full step-by-step guide (GitHub repo, service account roles, secrets, and first deploy).

Quick summary:

1. Push the repo to GitHub on the `main` branch
2. Add 7 repository secrets (`FIREBASE_SERVICE_ACCOUNT` + six `VITE_FIREBASE_*` values)
3. Every push to `main` automatically builds and deploys Hosting, Firestore rules, and Storage rules
4. You can also trigger a deploy manually from the **Actions** tab

---

## Using the Admin Panel

| Task | Where |
|------|-------|
| Update name, email, social links | `/admin/settings` |
| Edit bio and research interests | `/admin/about` |
| Add a publication | `/admin/publications` → Add publication |
| Include publication on CV | `/admin/publications` → toggle **Include in CV** |
| Post news | `/admin/news` → Add post → toggle **Published** |
| Build CV sections | `/admin/cv` → select section tab → Add entry → Save CV |
| Upload profile photo | `/admin/media` → upload → copy URL → paste in Settings |
| Download CV as PDF | Visit `/cv` → click **Download PDF** |

Changes save to Firestore and appear on the live site immediately — no rebuild needed for content updates.

---

## Troubleshooting

### "Firebase is not configured"
Copy `.env.example` to `.env` and fill in your Firebase credentials.

### Admin login fails
Verify the user exists in Firebase Authentication and Email/Password is enabled.

### Permission denied on save
Deploy Firestore rules: `firebase deploy --only firestore:rules`
Make sure you're logged in at `/admin/login`.

### PDF download looks wrong
Use your browser's **Print → Save as PDF** as a fallback. Client-side PDF export works best on the deployed site with fully loaded content.

### GitHub Action deploy fails
Check that all `VITE_FIREBASE_*` secrets and `FIREBASE_SERVICE_ACCOUNT` are set correctly.

---

## Cost

The **Firebase Spark (free) plan** is sufficient for a personal academic portfolio:
- Firestore: 50K reads/day, 20K writes/day
- Storage: 5 GB
- Hosting: 10 GB storage, 360 MB/day transfer
- Authentication: unlimited email/password users
