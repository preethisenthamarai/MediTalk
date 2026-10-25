# What you must do or add manually

Legend: 🔴 required to run, 🟡 strongly recommended before your review/demo, 🟢 optional / for deployment.

## 🔴 1. Install prerequisites
- Node.js 18 or newer (`node -v`)
- MongoDB, **one** of:
  - Local: install MongoDB Community Server and make sure it is running, **or**
  - Cloud: create a free MongoDB Atlas cluster, create a database user, allow your IP under *Network Access*, copy the connection string.
- Google Chrome or Microsoft Edge (speech recognition does not work in Firefox).

## 🔴 2. Configure environment
1. `npm run install:all`
2. `npm run setup` creates `server/.env` with random JWT secrets.
3. Open `server/.env` and set **`MONGODB_URI`** (Atlas string or local URL).
4. `npm run seed` loads demo users, the six languages and a starter glossary.
5. `npm run dev`, then open http://localhost:5173

## 🟡 3. Translation provider
The default (`mymemory`) needs no key but has a small daily limit, so it is fine for a demo and not for heavy use.
- Optional: put an email in `MYMEMORY_EMAIL` to raise the limit roughly ten-fold.
- Better quality: create a Google Cloud project, enable *Cloud Translation API*, create an API key (restrict it!), then set `TRANSLATION_PROVIDER=google` and `GOOGLE_TRANSLATE_API_KEY=...`. Billing must be enabled (there is a free monthly quota).
- No internet / UI testing only: `TRANSLATION_PROVIDER=mock`.

## 🟡 4. Test it on real devices yourself
I could build and compile the whole project, and I unit-tested the glossary and translation logic, but I **could not run the full app end-to-end** (no MongoDB, browser, camera or microphone in my environment). Please run through the demo in the README and expect to fix small things. Specifically test:
- Two people in a call (two browsers, or laptop + phone on the same Wi-Fi using your LAN IP over HTTPS or Chrome's insecure-origin flag).
- Tamil / Hindi speech recognition (needs internet; the browser sends audio to its speech service).
- The interpreter flow with three windows.
- Arabic UI direction (right-to-left).

## 🟡 5. Things only a human can supply (review material)
- **Screenshots** for slide 20: login, patient dashboard, video call with live captions, interpreter request screen. Take them from your running app.
- Update **progress percentages** on slide 19 to reflect reality.
- **Diagrams** (architecture, use-case, ER, wireframes) in your PPT are yours. The code follows the same entities and actors.
- The **literature survey / references** are unchanged from your slides. Check each citation yourself.

## 🟡 6. Content that needs expert review
- **Medical glossary** (`server/src/seed/seed.js`, editable in Admin → Glossary): the 15 starter terms in 5 languages were written by an AI and are marked `verified: false`. A bilingual medical professional or certified translator must check them. Do not claim clinical accuracy.
- **UI translations** (`client/src/i18n/locales/*.json`): Tamil, Hindi, Spanish, French and Arabic strings are machine-quality. Have a native speaker proofread them, especially Tamil and Hindi if you will demo them.
- Add a visible **disclaimer** ("not a substitute for a professional medical interpreter") if you show this to anyone outside your college.

## 🟢 7. Before any real deployment
- Delete or change **all demo accounts** created by the seed script.
- Use strong, unique `JWT_SECRET` / `JWT_REFRESH_SECRET` (the setup script does this) and never commit `.env`.
- Add a **TURN server** so video works on mobile data and corporate Wi-Fi: use a hosted one (Twilio Network Traversal, Metered, Xirsys) or self-host coturn, then fill `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` in `client/.env` and rebuild.
- Deploy over **HTTPS** (needed for camera and mic). Set `CLIENT_ORIGIN` to your real site URL and `NODE_ENV=production`.
- MongoDB Atlas: restrict the IP allow-list, enable backups.
- Consider moving tokens from `localStorage` to httpOnly cookies, and adding email verification and password reset.
- Real patient data brings legal duties (HIPAA, GDPR, India DPDP Act 2023): consent, encryption, audit logs, retention policy. This project does not cover them.

## 🟢 8. Optional extras you could add
- **Email / SMS notifications** (appointment reminders): add `nodemailer` or Twilio in `server/src/services/notify.js`. Right now notifications are in-app only.
- **A real interpreter service** (agency API, Twilio Voice/Video) instead of the in-house interpreter desk.
- **Server-side speech-to-text** (Google Speech-to-Text, Azure) for browsers without the Web Speech API.
- More UI languages: add `client/src/i18n/locales/xx.json`, register it in `client/src/i18n/index.js`, and add the language in Admin → Languages.
- Automated tests (Jest + Supertest for the API, Vitest for the client).
- Docker / `render.yaml` for one-click deployment.

## New in v2: things to check
- 🟡 **Proofread the new interface text** (landing page, portals, doctor dashboard) in Tamil, Hindi, Spanish, French and Arabic. Like the rest of the UI strings, they were written by an AI.
- 🟡 **Doctor approval:** anyone can submit `/doctor/register`. In a real deployment the admin must verify the medical registration number before ticking *Approved*. The app only stores the number, it does not check it.
- 🟢 Doctor availability hours and a "block this time slot" feature are not built yet. Right now the only rule is no double-booking within 30 minutes.
