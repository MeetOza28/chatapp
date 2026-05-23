# ChatApp 🚀

### Real-Time AI Powered Chat Application

A modern full-stack real-time chat platform built with **Next.js**, **FastAPI**, **PostgreSQL**, and **WebSockets**.

ChatApp supports live messaging, AI-powered responses using Gemini/Groq, room-based communication, typing indicators, reconnect logic, and scalable architecture using a Turborepo monorepo setup.

---

## ✨ Features

- ⚡ Real-time messaging with WebSockets
- 🤖 AI assistant support using `@ai`
- 🔐 Authentication using Better Auth
- 👥 Room-based chat system
- ✍️ Typing indicators
- 🟢 Online presence system
- 🔄 Automatic WebSocket reconnection
- 🧠 AI chat context support
- 🗂️ Turborepo monorepo architecture
- 🐳 Docker support
- 🎨 Modern responsive UI
- 📦 Shared TypeScript types across frontend/backend

---

# 🏗️ Tech Stack

## Frontend
- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Better Auth
- WebSockets

## Backend
- FastAPI
- Python
- SQLAlchemy
- PostgreSQL
- WebSockets
- Agno AI Framework

## AI
- Google Gemini
- Groq API support

## DevOps / Tooling
- Docker
- Turborepo
- PNPM Workspace
- UV (Python package manager)

---

# 📁 Monorepo Structure

```bash
chatapp/
│
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
│
├── packages/
│   ├── db/           # Shared DB package
│   └── shared-types/ # Shared TypeScript types
│
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

# ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_WS_URL=ws://localhost:8001

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=chatapp

DATABASE_URL=

# Auth
JWT_SECRET_KEY=your_secret_key

# AI
GOOGLE_API_KEY=your_google_api_key
AGNO_MODEL=gemini-2.0-flash

# Optional Groq
GROQ_API_KEY=your_groq_api_key
```

---

# 🚀 Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/MeetOza28/chatapp.git
cd chatapp
```

---

## 2️⃣ Install Dependencies

### Install PNPM Dependencies

```bash
pnpm install
```

### Install Python Dependencies

```bash
cd apps/api
uv sync
```

---

# 🐳 Run with Docker

```bash
docker compose up --build
```

Frontend:

```txt
http://localhost:3000
```

Backend:

```txt
http://localhost:8001
```

---

# 💻 Run Locally

## Start PostgreSQL

```bash
docker compose up postgres -d
```

---

## Start Backend

```bash
cd apps/api

uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

---

## Start Frontend

```bash
cd apps/web

pnpm dev
```

---

# 🤖 AI Assistant Usage

Inside any room:

```txt
@ai Explain WebSockets
```

The AI assistant will generate a contextual reply using previous room messages.

---

# 🔌 WebSocket Flow

Client connects once:

```txt
ws://localhost:8001/api/v1/ws?token=...
```

Then joins/leaves rooms dynamically:

```json
{
  "type": "join_room",
  "room_id": "room-id"
}
```

---

# 📡 WebSocket Events

## Client → Server

```json
{
  "type": "message",
  "room_id": "...",
  "content": "Hello"
}
```

```json
{
  "type": "typing",
  "room_id": "...",
  "is_typing": true
}
```

---

## Server → Client

```json
{
  "type": "message",
  "room_id": "...",
  "content": "Hello"
}
```

```json
{
  "type": "presence",
  "status": "online"
}
```

---

# 🧠 AI Architecture

ChatApp uses:

- Agno AI Framework
- Gemini / Groq providers
- Room message context memory
- Async AI processing
- Rate limiting support

---

# 🗄️ Database

PostgreSQL is used for:

- Users
- Sessions
- Rooms
- Room Members
- Messages

SQLAlchemy + Drizzle ORM are used across backend and shared packages.

---

# 🔒 Authentication

Authentication is handled using:

- Better Auth
- Secure session tokens
- DB-backed session validation
- Protected server routes

---

# 🛠️ Future Improvements

- File uploads
- Voice messages
- Read receipts
- Message reactions
- Notifications
- Redis scaling
- Kubernetes deployment
- End-to-end encryption
- AI streaming responses

---

# 📸 Screenshots

Add your screenshots here:

```md
![Rooms](./screenshots/rooms.png)
![Chat](./screenshots/chat.png)
```

---

# 🧑‍💻 Author

### Meet Oza

- GitHub: https://github.com/MeetOza28

---

# 📜 License

MIT License

---

# ⭐ Support

If you like this project:

- ⭐ Star the repository
- 🍴 Fork the project
- 🛠️ Contribute improvements

---

Built with ❤️ using Next.js, FastAPI, WebSockets, and AI.
