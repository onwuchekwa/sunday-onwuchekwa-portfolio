# Sunday Onwuchekwa Portfolio

Academic research portfolio built with **Vue 3**, **TypeScript**, **Vuetify**, and **Firebase Firestore**.

## Features

- Public site: Home, About, Publications, News, CV, Contact
- Admin panel at `/admin` for no-code content management
- Live academic CV builder with PDF download
- Instant content updates via Firestore (no rebuild required)

## Quick Start

```bash
npm install
cp .env.example .env   # add your Firebase credentials
npm run dev
```

See **[SETUP.md](./SETUP.md)** for Firebase setup, admin account, and seeding.

See **[GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md)** for deploying to Firebase via GitHub Actions.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run seed` | Seed Firestore with starter content |
| `firebase deploy` | Deploy to Firebase Hosting |
