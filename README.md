# ChatWave — Real-Time Chat with Friends

A full-stack chat app: React + Tailwind frontend, Node/Express + Socket.io backend, MongoDB storage.

## Stack
- **Frontend:** React (Vite), Tailwind CSS, Socket.io-client, react-router-dom, emoji-picker-react
- **Backend:** Node.js, Express, Socket.io, MongoDB (Mongoose), JWT auth, bcrypt, Multer (file uploads)

## Project structure
```
chat-app/
  backend/     Express API + Socket.io server
  frontend/    React (Vite) client
```

## Setup

### 1. MongoDB
You need a MongoDB instance — either install locally (https://www.mongodb.com/try/download/community)
or use a free MongoDB Atlas cluster (https://www.mongodb.com/atlas). Grab the connection string.

### 2. Backend
```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI and a real JWT_SECRET
npm install
npm run dev      # starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`, so just open
`http://localhost:5173` and register two accounts (e.g. in two browser windows / incognito)
to test real-time chat between friends.

## Feature coverage

**Implemented and working end-to-end:**
- Register / Login / Logout (JWT auth, bcrypt-hashed passwords)
- Edit profile: username, bio, profile picture upload
- Search users, send/accept/reject friend requests, friends list
- One-to-one real-time chat over Socket.io
- Text messages, emoji picker, image/video/document upload & download, voice message recording (MediaRecorder API) & playback
- Message timestamps, reply-to, delete (for me / for everyone)
- Typing indicator, online/offline status, last seen, read receipts ("Seen")
- Unread message counts per friend, badge updates in real time
- In-conversation message search
- Dark mode / light mode toggle (persisted)
- Responsive layout (mobile shows a single pane with back button; desktop shows both panes)
- Smooth UI transitions (fade/pop-in animations on messages, modals)

**Stubbed / simplified — good next steps:**
- **Push notifications for new messages** — currently unread counts update live via socket while
  the app is open, but there's no browser/OS push notification when the tab isn't focused. Adding
  the Notifications API (or a service worker) is a natural next step.
- **Encryption** — passwords are hashed with bcrypt (industry standard), but messages/files are
  stored in MongoDB and on disk unencrypted (standard for most chat apps, but flag if you need
  end-to-end encryption — that's a much larger undertaking involving per-device key exchange).
  Uses HTTPS in production to protect data in transit — make sure to deploy behind TLS.
  Currently on the JWT flowing over plain HTTP in dev — put a reverse proxy (e.g. Nginx/Caddy) with a
  TLS certificate in front in production.
- **File storage** — currently saved to local disk (`backend/uploads/`). For production, swap
  `utils/upload.js` to stream to S3 / Cloudinary / similar so it survives deploys and scales.
- **Message pagination** — basic "load older messages" query params exist on the backend
  (`?before=<timestamp>`), but the frontend doesn't yet have infinite-scroll wired up — it just
  loads the most recent 30.
- **Group chat** — this build is 1:1 chat only, as specified.

## Security notes for production
- Set a long random `JWT_SECRET`.
- Put the backend behind HTTPS.
- Consider rate-limiting auth routes (e.g. `express-rate-limit`) to slow brute-force attempts.
- Validate/limit file types server-side if you want to restrict what can be uploaded (currently any
  file type is accepted, size-limited to 50MB for chat media / 5MB for avatars).
