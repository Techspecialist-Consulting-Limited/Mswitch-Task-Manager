# Mswitch-Task-Manager

Task & goal management platform built with Next.js, NextAuth, Prisma, and PostgreSQL.

## Getting Started

```bash
npm install
npx prisma generate
npx tsx prisma/seed.ts
npm run dev
```

## Vercel Environment

Set these variables in Vercel before deploying:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="generate-a-long-random-secret"
```

Optional email variables:

```bash
RESEND_API_KEY="re_..."
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="TaskFlow <noreply@example.com>"
```

File uploads currently use local disk under `public/uploads`. That works for local development, but Vercel serverless storage is ephemeral, so production uploads should be moved to durable object storage such as Vercel Blob, S3, Cloudinary, or Supabase Storage.
