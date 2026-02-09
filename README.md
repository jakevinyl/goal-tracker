# Goal Tracker

A personal goal management app for tracking daily check-ins, time allocation, tasks, and progress across life areas.

## Features

### ✅ MVP (Complete)
- **Daily Check-In**: Score your day 1-10, track streaks, see 7/30-day averages
- **Time Tracking**: Manual entry + timer, track hours by life area (bucket)
- **Time Allocation**: Set target percentages, visualize actual vs target
- **Authentication**: Email/password login with Supabase Auth
- **Dashboard**: At-a-glance view of check-ins, time logged, upcoming goals
- **Responsive Design**: Works on desktop and mobile

### 🚧 Coming Soon
- Task management with recurring tasks
- Progress logging (journal with tags)
- Trends & analytics
- PWA offline support
- Weekly/monthly planning views

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to initialize (~2 minutes)
3. Go to **Project Settings → API** and copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key

### 2. Configure Environment

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Database

1. Go to **Supabase Dashboard → SQL Editor**
2. Copy and run the contents of `supabase/migrations/001_initial_schema.sql`
3. This creates all tables with Row Level Security enabled

### 4. Create Your Account

1. Run the development server: `npm run dev`
2. Go to `http://localhost:3000/auth/signup`
3. Create your account with email/password

### 5. Seed Initial Data

1. Go to **Supabase Dashboard → Authentication → Users**
2. Copy your User ID (UUID)
3. Go to **SQL Editor**
4. Open `supabase/seed.sql`
5. Replace `YOUR_USER_ID` with your actual User ID
6. Run the script

This will create:
- 13 life area buckets (Personal/Spiritual, Relationships sub-buckets, Health, etc.)
- Default survey question: "How alive do I feel today?"
- Time targets for Kids buckets
- Goals from your spec
- Recurring tasks

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
goal-tracker/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/               # Login/signup pages
│   │   └── dashboard/          # Main app pages
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── check-in/           # Daily check-in components
│   │   ├── time-tracking/      # Time tracking components
│   │   └── dashboard/          # Dashboard-specific components
│   └── lib/
│       ├── supabase/           # Supabase client config
│       ├── types/              # TypeScript types
│       └── utils/              # Utility functions
├── supabase/
│   ├── migrations/             # Database schema SQL
│   └── seed.sql                # Initial data script
└── public/                     # Static assets
```

## Database Schema

- **buckets**: Life areas (can have parent/child relationships)
- **goals**: High-level objectives linked to buckets
- **tasks**: Actionable items with recurrence support
- **survey_questions**: Configurable daily check-in questions
- **check_in_responses**: Daily scores with notes
- **time_targets**: Target % allocation per bucket
- **time_entries**: Logged time (manual or timer)
- **progress_log_entries**: Journal entries with tags
- **user_settings**: User preferences

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

## License

Private - Personal use only
