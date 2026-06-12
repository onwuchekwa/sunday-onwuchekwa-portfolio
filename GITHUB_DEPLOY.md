# Deploy to Firebase via GitHub Actions

This project deploys automatically when you push to the `main` branch. You can also trigger a deploy manually from the GitHub Actions tab.

## One-time setup

### 1. Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `sunday-onwuchekwa-portfolio` (or any name you prefer)
3. Do **not** initialize with a README (you already have one locally)

### 2. Push your code

```bash
cd C:\Users\donso\Projects\sunday-onwuchekwa-portfolio
git add .
git commit -m "Initial portfolio setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sunday-onwuchekwa-portfolio.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### 3. Create a Firebase service account

The GitHub Action needs permission to deploy on your behalf.

1. Open [Firebase Console](https://console.firebase.google.com/) → your project
2. Click the gear icon → **Project settings**
3. Go to **Service accounts**
4. Click **Manage service account permissions** (opens Google Cloud Console)
5. Find the `firebase-adminsdk-...` service account
6. Click **Edit** (pencil icon) → **Add another role**
7. Add these roles (use **Add another role** for each):
   - **Firebase Admin** (recommended — covers Hosting + Firestore rules deploy)
   - **Firebase Hosting Admin**
   - **Service Usage Consumer** (fixes `Permission denied to get service [firestore.googleapis.com]`)
8. Back in Firebase → **Service accounts** → **Generate new private key**
9. Save the downloaded JSON file — you will paste its contents into GitHub

### 4. Add GitHub repository secrets

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

Add each secret below. Values come from your Firebase web app config (Project settings → Your apps → SDK setup).

| Secret name | Where to get the value |
|-------------|------------------------|
| `FIREBASE_SERVICE_ACCOUNT` | Paste the **entire contents** of the service account JSON file |
| `VITE_FIREBASE_API_KEY` | `apiKey` from Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

> For `FIREBASE_SERVICE_ACCOUNT`, open the JSON file in a text editor, select all, and paste the full JSON (including `{` and `}`).

### 5. Enable Firebase services in the console (first time only)

Do these once in [Firebase Console](https://console.firebase.google.com/) so CI does not need to enable APIs:

1. **Firestore** → **Create database** → Production mode → pick a region
2. **Authentication** → enable **Email/Password**
3. **Hosting** → **Get started** (you do not need to finish the CLI wizard)

### 6. Trigger the first deploy

Either:

- Push any commit to `main`, or
- GitHub repo → **Actions** → **Deploy to Firebase** → **Run workflow**

The workflow will:

1. Install dependencies
2. Build the Vue app (with your Firebase env vars baked in)
3. Deploy Hosting + Firestore rules

Your site will be live at:

```
https://YOUR_PROJECT_ID.web.app
https://YOUR_PROJECT_ID.firebaseapp.com
```

---

## How it works

The workflow file is [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

| Trigger | What happens |
|---------|----------------|
| Push to `main` | Automatic build and deploy |
| Manual (workflow_dispatch) | Run deploy on demand from Actions tab |

Content you edit in `/admin` is stored in Firestore and does **not** require a redeploy. GitHub Actions only redeploys when **code** changes are pushed.

---

## Troubleshooting

### `Error: Request had invalid authentication credentials`

- Regenerate the service account key and update the `FIREBASE_SERVICE_ACCOUNT` secret
- Confirm the service account has **Firebase Hosting Admin** role

### `HTTP Error: 403, Permission denied to get service [firestore.googleapis.com]`

This means the **service account in `FIREBASE_SERVICE_ACCOUNT`** lacks IAM permissions.

1. Open the `FIREBASE_SERVICE_ACCOUNT` secret in GitHub and note the `"client_email"` value (e.g. `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com`). You can also open your downloaded JSON key file locally.
2. Go to [Google Cloud IAM](https://console.cloud.google.com/iam-admin/iam) → select project **`sunday-onwuchekwa-portfolio`**
3. Find that service account → click **Edit** (pencil)
4. **Add another role** → add **Firebase Admin**
5. **Add another role** → add **Service Usage Consumer**
6. Click **Save**
7. Wait 1–2 minutes, then re-run the GitHub Action (**Actions → Deploy to Firebase → Re-run jobs**)

You do **not** need a new JSON key after adding roles — the existing `FIREBASE_SERVICE_ACCOUNT` secret keeps working.

### `HTTP Error: 403` (other)

Add the roles listed in Step 3 to the Firebase Admin SDK service account.

### Build succeeds but site shows "Firebase is not configured"

One or more `VITE_FIREBASE_*` secrets are missing or incorrect. Vite bakes these into the build at compile time — double-check every secret matches your Firebase web app config.

### Deploy fails with "Firebase Hosting site not found"

Open Firebase Console → Hosting → Get started, then re-run the workflow.

### Check workflow logs

GitHub repo → **Actions** → click the failed run → expand the failed step for the error message.
