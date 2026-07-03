# DriveHub — Car Rental Marketplace

Production-ready car rental marketplace built with **Next.js 15**, **PostgreSQL**, and **Prisma**.

---

## Deploy to Vercel (3 steps)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Create a PostgreSQL database

Use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app). Copy the connection string.

### 3. Deploy on Vercel

1. Import your GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `JWT_SECRET` | Random string (32+ chars). Generate: `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_APP_NAME` | `DriveHub Marketplace` |
| `ADMIN_EMAIL` | Your admin login email |
| `ADMIN_PASSWORD` | Strong admin password |
| `ADMIN_PHONE` | Admin phone (e.g. `+923001234567`) |

3. Click **Deploy**

### 4. Initialize the database (once)

After the first deploy, run locally against your production database:

```bash
# Set DATABASE_URL to your production DB in .env.local, then:
npm run db:push
npm run db:seed
```

This creates all tables, countries/cities, and your admin account. **Do not commit `.env.local`.**

---

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your local DATABASE_URL and secrets
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:seed` | Seed roles, countries, cities, and admin |
| `npm run db:studio` | Open Prisma Studio |

---

## Project structure

```
src/app/          Pages and API routes
src/components/   UI components
src/lib/          Auth, database, utilities
prisma/           Schema and seed
public/           Static assets
```

---

## Security notes

- Never commit `.env` or `.env.local`
- Use a unique `JWT_SECRET` for production
- Set strong `ADMIN_PASSWORD` before running seed
- Admin accounts are created only via `ADMIN_EMAIL` + `ADMIN_PASSWORD` in seed

---

## Tech stack

- Next.js 15 (App Router)
- PostgreSQL + Prisma
- Tailwind CSS
- JWT authentication (HTTP-only cookies)
