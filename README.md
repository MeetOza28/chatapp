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
