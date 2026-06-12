# Seed Starter Content

This one-time step fills Firestore with sample bio, publications, news, and CV content.

## Step 1: Download the service account key

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select project **`sunday-onwuchekwa-portfolio`**
3. Click the gear icon → **Project settings**
4. Open the **Service accounts** tab
5. Click **Generate new private key** → **Generate key**
6. A JSON file downloads (name like `sunday-onwuchekwa-portfolio-firebase-adminsdk-xxxxx.json`)

## Step 2: Save it as `service-account.json`

Move or rename the downloaded file to your project root:

```
C:\Users\donso\Projects\sunday-onwuchekwa-portfolio\service-account.json
```

The file must be named exactly `service-account.json` and sit next to `package.json`.

> **Never commit this file to Git.** It is already listed in `.gitignore`.

## Step 3: Enable Firestore (if you haven't)

Firebase Console → **Firestore Database** → **Create database** → **Production mode** → pick a region.

## Step 4: Run the seed script

Open PowerShell in the project folder:

```powershell
cd C:\Users\donso\Projects\sunday-onwuchekwa-portfolio
npm run seed
```

You should see:

```
Using Firebase project: sunday-onwuchekwa-portfolio
Seeding Firestore collections...

  ✓ siteSettings/main
  ✓ about/main
  ✓ publications/...
  ✓ news/...
  ✓ cv/main

Done! Your portfolio is ready with starter content.
```

## Step 5: Verify

1. Run `npm run dev` and open [http://localhost:5173](http://localhost:5173)
2. Or visit your deployed site: [https://sunday-onwuchekwa.web.app](https://sunday-onwuchekwa.web.app)

Content should appear on Home, About, Publications, News, and CV.

## Troubleshooting

### `Missing service-account.json`
The file is not in the project root or has a different name. Rename it to `service-account.json`.

### `PERMISSION_DENIED` or `7 PERMISSION_DENIED`
- Firestore must be created in the console first
- The service account needs **Cloud Datastore User** or **Firebase Admin** role

### `Using Firebase project: some-other-project`
You downloaded the key from the wrong Firebase project. Use the key from **`sunday-onwuchekwa-portfolio`**.

### Seed ran but site is empty
Confirm your `.env` `VITE_FIREBASE_PROJECT_ID` matches the project you seeded (`sunday-onwuchekwa-portfolio`).
