# Chore Champions 🏆

A gamified team chore tracking application with points, streaks, and leaderboards.

## Features

- 🎯 **Team Chores** - Create and assign chores to team members
- 🔄 **Flexible Scheduling** - Daily, weekly, bi-weekly, and monthly chores with start dates
- 🏅 **Gamification** - Earn points, maintain streaks, climb the leaderboard
- 📊 **GitHub-style Activity Graph** - Track your completion history
- 🎉 **Confetti Celebrations** - Celebrate completing tasks
- 🖱️ **Drag & Drop** - Kanban-style board to manage tasks
- 🌙 **Dark Mode** - Beautiful dark theme support
- 📱 **Responsive** - Works on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Auth**: JWT with bcryptjs
- **UI**: Lucide Icons, @dnd-kit for drag-and-drop

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or cloud)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chore-champions.git
cd chore-champions
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.example .env.local
```

4. Update environment variables in `.env.local`:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Railway

### Quick Deploy

1. Push your code to GitHub
2. Go to [Railway](https://railway.app) and create a new project
3. Select "Deploy from GitHub repo"
4. Add environment variables in Railway dashboard:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string (generate with `openssl rand -base64 32`)
5. Railway will automatically build and deploy!

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `NODE_ENV` | Set to `production` automatically |
| `PORT` | Set by Railway automatically |

## Scripts

- `npm run dev` - Development server with Turbopack
- `npm run build` - Production build
- `npm start` - Production server
- `npm run lint` - Run ESLint

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/chores` | List chores (filtered by schedule) |
| POST | `/api/chores` | Create chore |
| PATCH | `/api/chores/:id/toggle` | Toggle completion |
| DELETE | `/api/chores/:id` | Delete chore |
| GET | `/api/team/members` | Get team members |

## License

MIT
