# Dyldraw (Next.js)

Dyldraw is a Next.js app that embeds Excalidraw with:
- username/password sign in
- per-user saved drawings
- Vercel-ready deployment

## Stack
- Next.js (App Router)
- Excalidraw
- Firebase Authentication
- Cloud Firestore

## Local setup

1. Create a Firebase project.
2. In Firebase Console, enable:
   - Authentication -> `Email/Password`
   - Firestore Database (production mode)
3. Copy env template and fill values:

```bash
cp .env.example .env.local
```

4. Install and run:

```bash
pnpm --dir examples/with-nextjs install
pnpm --dir examples/with-nextjs dev
```

5. Open [http://localhost:3005](http://localhost:3005).

## Username/password note

Firebase Auth uses email/password under the hood.  
Dyldraw maps `username` to an internal email (`username@dyldraw.local`) so users can log in with only username + password in the UI.

## Firestore rules (required)

Use rules like this so users can access only their own scenes:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/scenes/{sceneId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /profiles/{profileId} {
      allow read, write: if request.auth != null && request.auth.uid == profileId;
    }
  }
}
```

## Deploy on Vercel

1. Push your Dyldraw fork to GitHub.
2. In Vercel, import the repo and set `Root Directory` to `examples/with-nextjs`.
3. Add the same Firebase env vars from `.env.local` in Vercel project settings.
4. Deploy.

## Current limitations

- Scene storage currently uses Firestore document size limits. Very large scenes can fail to save.
- This first version stores Excalidraw scene JSON (no custom backend yet).
