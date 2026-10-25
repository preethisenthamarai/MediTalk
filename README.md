# MediTalk: Multilingual Telemedicine App (MERN)

*Breaking Language Barriers in Telemedicine: A Multilingual App for Real-Time Medical Translation*
Easwari Engineering College, Department of Computer Science and Design

A video-consultation app where patient and clinician each speak and read **their own language**.
Speech is recognised in the browser, translated on the server with a **medical glossary** protecting
clinical terms, and shown as live captions. Complex or high-risk conversations can be escalated to a
**live human interpreter** who joins the same call.

> **Read `docs/MANUAL_CHECKLIST.md` first.** It lists everything that must be done or added by hand.

## Quick start

Requirements: **Node 18+**, **MongoDB** (local, or a free Atlas cluster), **Chrome or Edge** for speech recognition.

```bash
npm run install:all     # installs root, server and client
npm run setup           # creates server/.env with random JWT secrets
# edit server/.env -> set MONGODB_URI if yours is not mongodb://127.0.0.1:27017/telemed
npm run seed            # demo users, languages, starter glossary
npm run dev             # API on :5000, web app on http://localhost:5173
```

Demo accounts (created by the seed script, **delete before any public deployment**):

| Role | Email | Password |
|---|---|---|
| Admin | admin@telemed.test | Admin@12345 |
| Clinician (English) | doctor@telemed.test | Doctor@12345 |
| Patient (Tamil) | patient.ta@telemed.test | Patient@12345 |
| Patient (Spanish) | patient.es@telemed.test | Patient@12345 |
| Interpreter | interpreter@telemed.test | Interp@12345 |

### Try the full flow (about 3 minutes)
1. Window A: log in as **patient.ta**, open **Book visit**, choose Dr. Priya, pick a time, submit.
2. Window B (another browser or private window): log in as **doctor**, open the dashboard, and click **Join call**. Then in A click **Join call**.
3. Speak. Patient speaks Tamil and the doctor sees English captions. The doctor speaks English and the patient sees Tamil. Say "I have chest pain" to see the glossary and the high-risk warning.
4. In A click **Request interpreter**. In a third window log in as **interpreter**, accept the request, and the interpreter joins the same call.
5. Doctor clicks **End visit**, writes instructions in English, and saves. The patient's dashboard shows them translated.

Use headphones, otherwise the microphone picks up the other person's voice.

## Portals (patient / doctor / staff)

| Page | URL | Who |
|---|---|---|
| Landing page | `/` | everyone |
| Patient login / sign-up | `/login`, `/register` | patients |
| Doctor login / sign-up request | `/doctor/login`, `/doctor/register` | doctors |
| Staff login | `/staff/login` | interpreters and admins |

* Each login page only accepts its own kind of account. A doctor who uses the patient page is told to use the doctor login.
* **Doctors cannot sign themselves in right away.** `/doctor/register` creates the account as *unapproved*. An admin approves it in **Admin → Users → Approved**. Until then it cannot log in or be booked.
* The seeded demo doctors are already approved.
* Patient, doctor, and staff portals share a blue colour theme, with a light/dark switch in the top bar.
* The doctor dashboard shows today's schedule, upcoming and past visits, a patient list (with each patient's language) and quick stats. Doctors get the same live translation in the call as patients.

## How it maps to the review slides

| Slide module | Where it lives |
|---|---|
| User Management (Signup, Login, JWT) | `server/src/controllers/authController.js`, `middleware/auth.js`, `client/src/context/AuthContext.jsx` |
| Video Consultation (Book, Join, End) | `appointmentController.js`, `sockets/index.js` (WebRTC signalling), `client/src/hooks/useRoom.js`, `pages/ConsultationRoom.jsx` |
| Real-Time Translation | `services/translationService.js` + `glossaryService.js`, `client/src/hooks/useSpeechRecognition.js` |
| Multilingual Navigation | `client/src/i18n/` (6 locales, RTL for Arabic), `components/LanguageSelector.jsx` on every screen |
| Interpreter Integration | `interpreterController.js`, `pages/InterpreterDashboard.jsx`, high-risk glossary escalation prompt |
| Admin: users, languages, glossary | `adminController.js`, `pages/AdminPanel.jsx` |

**Collections:** Users, Appointments, Consultations, Translations, Glossary (as in the ER diagram), plus Languages, InterpreterRequests and Notifications.

### REST API (slide 18 endpoints are the first six)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a patient |
| POST | `/api/auth/login` | Authenticate, returns access and refresh JWT (`portal`: patient / doctor / staff is optional) |
| POST | `/api/auth/register-doctor` | Request a doctor account (needs admin approval) |
| POST | `/api/appointments` | Book a video consultation (patient) |
| GET | `/api/appointments` | List the user's appointments |
| POST | `/api/translate` | Translate text with glossary protection |
| POST | `/api/interpreters/request` | Request a live interpreter |
| POST | `/api/auth/refresh` | Exchange refresh token for new tokens |
| GET/PATCH | `/api/auth/me` | Profile / preferred language |
| PATCH | `/api/appointments/:id/cancel`, `/complete` | Cancel / end visit + translated instructions |
| GET | `/api/interpreters/pending`; POST `/:id/accept`, `/:id/complete` | Interpreter desk |
| GET | `/api/consultations/:roomId/transcript` | Stored bilingual transcript |
| GET | `/api/notifications`; PATCH `/read-all` | In-app notifications |
| GET | `/api/languages` | Enabled languages |
| `/api/admin/*` | Users, glossary, languages CRUD (admin only) |

Import `docs/telemed.postman_collection.json` into Postman to test.

Socket.IO events: `join-room`, `signal`, `caption`, `set-language`, `peer-joined`, `peer-left`, `interpreter-request`, `interpreter-accepted`, `room-ended`.

## How live translation works

```
Browser mic -> Web Speech API (speech-to-text, on device)
            -> Socket.IO "caption"  -> Express
            -> glossary terms swapped for tokens -> machine translation API -> tokens swapped for approved terms
            -> sent to each listener in THEIR language (one translation per distinct language) -> saved in MongoDB
```

* Only **final** phrases are translated (interim text is shown locally), which keeps latency near the < 2 s target and API usage low.
* If the translation provider fails, the call keeps working: the original text is shown with a warning that suggests requesting an interpreter.
* Choose a provider with `TRANSLATION_PROVIDER` in `server/.env`: `mymemory` (free, no key, small daily quota), `google` (needs `GOOGLE_TRANSLATE_API_KEY`), `libretranslate`, or `mock` (offline UI testing).

## Production build / deployment

```bash
npm run build     # builds client/dist
npm start         # Express serves the API, sockets AND the built React app on one port
```

* **Single service (easiest, e.g. Render):** build command `npm run install:all && npm run build`, start command `npm start`, set the `server/.env` values as environment variables, set `CLIENT_ORIGIN` to your public URL, `NODE_ENV=production`.
* **Split (Vercel/Netlify + Render):** set `VITE_API_URL=https://your-api.onrender.com/api` and `VITE_SOCKET_URL=https://your-api.onrender.com` at client build time, and `CLIENT_ORIGIN=https://your-site` on the server.
* Camera and microphone only work over **HTTPS** (localhost is exempt). Render, Vercel and Netlify provide HTTPS automatically.

## Known limitations (be upfront about these in your review)

* Machine translation is **not** a certified medical interpreter. The glossary reduces errors for listed terms only, and it is a *starter* list that is **not clinically verified**.
* Speech recognition quality varies by language and accent, needs internet, and is only available in Chrome, Edge and Safari. Firefox lacks it (typed messages still work).
* Video uses a peer-to-peer WebRTC mesh with a public STUN server. It is fine for 2-3 people, but calls on strict networks need a TURN server (see checklist).
* "Interpreter integration" means a human interpreter *joins the same call* from the interpreter desk. There is no connection to an external agency or phone interpreting service.
* Tokens are kept in `localStorage` for simplicity. For production, prefer httpOnly cookies.
* This is a student project: it has **not** been assessed for HIPAA / GDPR / India DPDP compliance and must not be used with real patient data as it stands.

## Interpreter Desk and role-based access

### Login and dashboard routing

The app uses role-aware authentication with a shared backend. The login portal is selected by role:

| Role | Login entry point | Destination after login |
|---|---|---|
| Patient | `/login` | Patient dashboard |
| Clinician/doctor | `/doctor/login` | Clinician dashboard |
| Interpreter | `/staff/login` | Interpreter Desk at `/interpreter` |
| Administrator | `/staff/login` | Admin panel |

The staff login entry point is shared by interpreters and administrators, but the server-side account role determines which protected dashboard and API permissions are available. A client-side route guard improves navigation; it is not a replacement for server authorization.

Administrators create interpreter accounts in the Admin panel. Configure the account's spoken language codes so they match the language codes used by the enabled Languages records and patient requests. Interpreter accounts are not intended to be publicly self-registered.

### Interpreter request workflow

1. A patient or clinician requests an interpreter from an active consultation.
2. The server validates room access, obtains the language from the existing consultation/user data, and creates a persistent interpreter request.
3. The request is broadcast to the authorized interpreter queue through Socket.IO. The desk also refreshes on a 15-second polling interval as a fallback.
4. The desk displays the language, priority, request time, status, and available actions. High-priority requests are shown before normal-priority requests.
5. An eligible interpreter accepts the request. The server performs a conditional/atomic update so two interpreters cannot both win the same pending request.
6. The patient/clinician receives an acceptance event and the interpreter's display name. The assigned interpreter can open only an authorized room associated with their accepted/in-progress request.
7. The interpreter can complete the assigned request through the desk.

The desk route is `/interpreter`, and its primary UI is `client/src/pages/InterpreterDashboard.jsx`. The request model, API routes, and controller are under `server/src/models/InterpreterRequest.js`, `server/src/routes/interpreterRoutes.js`, and `server/src/controllers/interpreterController.js` respectively.

### Interpreter API reference

| Method | Endpoint | Purpose / access |
|---|---|---|
| `POST` | `/api/interpreters/request` | Create a request from an authorized consultation user |
| `GET` | `/api/interpreters/pending` | Load pending requests and the logged-in interpreter's assigned requests; interpreter/admin authorization applies, with interpreter-specific filtering |
| `POST` | `/api/interpreters/:id/accept` | Accept a pending request when the interpreter is active and supports its language |
| `POST` | `/api/interpreters/:id/complete` | Complete a request assigned to the logged-in interpreter |
| `GET` | `/api/interpreters/room/:roomId/status` | Check interpreter assignment/access status where used by the room UI |

Use the current route/controller implementation as the source of truth if endpoint details change. Do not expose private patient information in global socket broadcasts; only send the minimum data needed by the relevant user or interpreter queue.

### Real-time events and fallback

The interpreter flow uses the existing Socket.IO server and includes the `interpreter-request`, `interpreter-accepted`, `interpreter-request-taken`, and `interpreter-request-updated` events. The dashboard re-fetches authoritative API data after relevant events and periodically polls every 15 seconds so it can recover from missed events or temporary socket disconnections. MongoDB/API state remains authoritative; a socket event alone must not be treated as proof that an action succeeded.

### Run locally

From the repository root, install all dependencies and start the app using the scripts defined in the root `package.json`:

```powershell
npm run install:all
npm run setup
# Edit server/.env and set MONGODB_URI and any provider/origin settings needed locally.
npm run seed
npm run dev
```

`npm run dev` starts the Express/Socket.IO backend and Vite frontend together. The app is normally available at `http://localhost:5173`, and the API at `http://localhost:5000`.

If dependencies are already installed, use `npm run dev`. To build the frontend, run `npm run build` from the repository root. If the root install script fails, install each package explicitly with `npm install`, `npm install --prefix server`, and `npm install --prefix client`.

Configure `server/.env` locally using `server/.env.example`. Never commit or share `.env` secrets. Use only seeded demo accounts for local testing, change/remove demo credentials before deployment, and do not use real patient data in this student project.

### Manual end-to-end verification

- [ ] Start MongoDB and the backend/frontend; confirm the API and Vite server start without errors.
- [ ] Log in as an administrator and create an interpreter with at least one spoken language enabled in Languages.
- [ ] Log in as the interpreter using `/staff/login`; confirm successful routing to `/interpreter`.
- [ ] In a separate browser/session, log in as a patient or clinician and enter an authorized consultation room.
- [ ] Request an interpreter and confirm the pending request appears on the desk without a manual page refresh.
- [ ] Disconnect/reconnect the socket or temporarily test polling to verify the desk refreshes from the API.
- [ ] Accept the request and confirm the requester sees the interpreter's name and accepted state.
- [ ] Attempt acceptance from a second interpreter session and confirm the same request cannot be claimed twice.
- [ ] Confirm an unassigned interpreter cannot open the consultation room.
- [ ] Complete the request and confirm the status updates in the desk.
- [ ] Re-test patient, clinician, and administrator login and dashboard flows.

This checklist is a manual test plan, not a claim that every item has been executed in the current environment. Video, microphone, translation-provider, and database behavior also depend on local configuration and browser/network permissions.
