# ProductAI Studio

智能图生图平台 - AI-Powered Product Image Generation

## Features

- 🎨 **AI Image Generation**: Generate product and model images using Gemini API
- 🔐 **User Authentication**: Secure login system with role-based access
- 👥 **Admin Panel**: User management for administrators
- 🐳 **Docker Ready**: One-click deployment with Docker Compose
- 🌏 **Chinese UI**: Fully localized interface

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

## Production Deployment (Ubuntu 24.04)

```bash
# 1. Clone repository
git clone <repo> && cd luminescent-crab

# 2. Configure environment
cp .env.example .env.production
nano .env.production  # Set API keys, session secret, etc.

# 3. Deploy
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The app will be available at `http://your-server-ip:80`

Default login: `admin` / (password from `.env.production`)

## Environment Variables

See [.env.example](.env.example) for all available options:

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | **Required.** Random string for session encryption |
| `GEMINI_API_KEY_1` | Primary Gemini API key |
| `GEMINI_API_KEY_2` | Secondary API key (optional) |
| `DEFAULT_ADMIN_PASSWORD` | Initial admin password |

## Project Structure

```
├── server/                 # Express backend
│   ├── index.js           # Server entry point
│   ├── db.js              # SQLite database
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   └── middleware/        # Auth middleware
├── src/                   # React frontend
│   ├── components/        # UI components
│   ├── contexts/          # State management
│   └── services/          # API adapters
├── Dockerfile             # Container build
├── docker-compose.yml     # Orchestration
└── scripts/deploy.sh      # Deployment script
```

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion
- **Backend**: Express.js, SQLite (better-sqlite3)
- **Auth**: express-session, bcryptjs
- **Deployment**: Docker, Docker Compose

## License

Private - All rights reserved.
