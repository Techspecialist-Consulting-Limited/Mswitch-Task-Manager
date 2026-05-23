# Mswitch-Task-Manager

Task & goal management platform built with Next.js, NextAuth, Prisma, and PostgreSQL (Neon).

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Copy env vars
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# Push schema to database
npx prisma db push

# Run setup for admin account
npx tsx prisma/setup-admin.ts

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `AUTH_SECRET` | Yes | Random secret for NextAuth session encryption |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app URL (e.g. `https://yourapp.vercel.app`) |
| `RESEND_API_KEY` | No | Resend API key for transactional emails |
| `SMTP_HOST` | No | SMTP server hostname |
| `SMTP_PORT` | No | SMTP port (default 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | Sender email address |

## Setup Admin Account

```bash
npx tsx prisma/setup-admin.ts
```

This script:
- Removes test/demo users (emails containing `test`, `smoke`, `@taskflow.com`, or `example.com`)
- Cleans up their related data (goals, tasks, comments, notifications, API keys, weekly updates)
- Creates or updates the super admin with the credentials you define in the script

## Vercel Deployment

1. Connect your GitHub repo to Vercel
2. Set all required environment variables in Vercel Dashboard → Settings → Environment Variables
3. The `vercel-build` script runs `prisma generate && next build`
4. After first deploy, run `npx prisma db push` against Neon (or run setup script)

## Password Reset

Password reset works through email. Configure either:
- **Resend** (recommended): Set `RESEND_API_KEY`
- **SMTP**: Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

If no email provider is configured, reset links are logged to the server console.

## Production Notes

- Database: PostgreSQL via Neon (SQLite is not used in production)
- File uploads currently use local disk under `public/uploads`. For production on Vercel, move to durable object storage (Vercel Blob, S3, Cloudinary, Supabase Storage).

## Tech Stack

- **Framework:** Next.js (App Router)
- **Auth:** NextAuth v5 (Credentials provider)
- **Database:** PostgreSQL via Prisma + Neon adapter
- **UI:** Tailwind CSS, custom components (Button, Card, Input, etc.)
- **State:** Zustand (sidebar)
- **Icons:** Lucide React
