# NextTripy — Car Rentals & Hotel Rooms

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**NextTripy** is a full-stack marketplace for **car rentals** and **hotel rooms**. Customers browse verified partners, filter by country and city, and contact providers directly on WhatsApp. Rental companies and hotels manage listings and subscriptions through role-based dashboards.

> NextTripy is a listing and discovery platform. Bookings, payments, and rental agreements happen directly between customers and providers.

---

## Features

### Marketplace
- Browse **cars** and **hotel rooms** with country, city, and listing filters
- Company / hotel directory with profiles, ratings, and reviews
- Direct **WhatsApp** contact for every listing
- Room prices shown in the hotel’s **local currency** (e.g. PKR for Pakistan)
- Light / dark theme, PWA install, SEO (sitemap, robots, Open Graph, JSON-LD)

### Accounts & roles
- JWT auth via HTTP-only cookies (`jose` + `bcryptjs`)
- Roles: `CUSTOMER`, `COMPANY`, `HOTEL`, `ADMIN`, `SUPER_ADMIN`
- Admin approval for **customer** and **company/hotel** accounts
- Car and room listings go **live immediately** when an approved subscribed partner creates them (admin can still suspend)

### Partner dashboards
- Car rental fleet management (images, specs, documents)
- Hotel room management (type, nightly price, amenities, images)
- Monthly subscription with multi-currency display (base **PKR 8,500**)
- Bank-transfer payment proof + admin verification

### Admin portal
- Approve / reject / suspend users and companies
- Suspend listings if needed
- Verify subscription payments
- Platform bank details
- In-app notifications + SMTP email alerts

### Localization
- 25+ countries with cities, dial codes, flags, and currencies
- Country-specific business form validation

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3, Framer Motion |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | JWT (`jose`), bcrypt, cookie sessions |
| Email | Nodemailer (SMTP — e.g. cPanel or Gmail) |
| UI | Sonner toasts, next-themes |
| Images | Next.js Image + Sharp |
| Deploy | Vercel (recommended) |

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or cloud)
- npm

### 1. Install

```bash
git clone <your-repo-url>
cd nexttripy
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in `DATABASE_URL`, `JWT_SECRET`, app URL, admin seed values, and SMTP settings.

### 3. Database

```bash
npm run db:setup
```

### 4. Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret (32+ characters) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public site URL |
| `NEXT_PUBLIC_APP_NAME` | No | Display name (default: `NextTripy`) |
| `ADMIN_EMAIL` | Seed | First super-admin email |
| `ADMIN_PASSWORD` | Seed | First super-admin password |
| `ADMIN_PHONE` | Seed | Admin phone |
| `SMTP_HOST` | Email | e.g. `mail.nexttripy.com` or `smtp.gmail.com` |
| `SMTP_PORT` | Email | Prefer `587` (STARTTLS) |
| `SMTP_USER` | Email | SMTP username |
| `SMTP_PASS` | Email | SMTP password |
| `SMTP_FROM` | Email | e.g. `NextTripy <info@nexttripy.com>` |

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/nexttripy?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="NextTripy"

ADMIN_EMAIL="admin@nexttripy.com"
ADMIN_PASSWORD="change-me"
ADMIN_PHONE="+920000000000"

SMTP_HOST="mail.nexttripy.com"
SMTP_PORT="587"
SMTP_USER="info@nexttripy.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="NextTripy <info@nexttripy.com>"
```

> Wrap `SMTP_FROM` in one pair of quotes around the **whole** value. Do not use nested quotes like `"NextTripy" <email>`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create / apply migrations |
| `npm run db:seed` | Seed roles, countries, cities, admin |
| `npm run db:setup` | `db:push` + `db:seed` |
| `npm run db:purge-demo` | Remove demo data |
| `npm run db:studio` | Prisma Studio |

Optional admin reset (if needed):

```bash
npx tsx prisma/ensure-admin.ts
```

---

## API overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register customer |
| POST | `/api/auth/register-company` | Register company / hotel |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/cars` | List / create cars |
| GET/PATCH | `/api/cars/[id]` | Car detail / update |
| GET/POST | `/api/rooms` | List / create rooms |
| GET/PATCH/DELETE | `/api/rooms/[id]` | Room detail / update / delete |
| GET | `/api/companies` | List companies |
| GET | `/api/companies/[id]` | Company profile |
| GET/POST | `/api/reviews` | Reviews |
| GET | `/api/countries` | Countries |
| GET | `/api/cities` | Cities |
| GET | `/api/currency` | Currency conversion |

### Admin & account
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PATCH | `/api/admin` | Admin data and actions |
| GET/PATCH | `/api/notifications` | Notifications |
| GET/POST | `/api/subscriptions` | Subscriptions |
| GET/PATCH | `/api/bank-details` | Platform bank details |
| GET | `/api/test-email` | Admin SMTP smoke test |

---

## Project structure

```
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── ensure-admin.ts
│   └── purge-demo.ts
├── public/                 # Static assets, PWA icons, service worker
├── src/
│   ├── app/
│   │   ├── api/            # REST API routes
│   │   ├── auth/
│   │   ├── dashboard/      # admin, company, hotel, customer
│   │   ├── marketplace/    # cars, rooms, companies
│   │   ├── about|contact|privacy|terms|visit/
│   │   └── LandingPageClient.tsx
│   ├── components/         # layout, shared UI, SEO
│   ├── hooks/
│   ├── lib/                # auth, db, email, currency, validation
│   ├── types/
│   └── middleware.ts
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── vercel.json
└── package.json
```

---

## Deployment (Vercel)

1. Create PostgreSQL (Neon / Supabase / Railway). Prefer a **pooled** connection string; remove `channel_binding=require` if present.
2. Import the repo on Vercel and set env vars from `.env.example`.
3. Deploy (`vercel.json` runs `prisma generate` before build).
4. Seed once:

```bash
DATABASE_URL="your-production-url" npx prisma db push
DATABASE_URL="your-production-url" npx prisma db seed
```

Checklist:

- [ ] Strong `JWT_SECRET`
- [ ] `NEXT_PUBLIC_APP_URL` matches the live domain
- [ ] Admin seed completed
- [ ] SMTP configured and tested (`/api/test-email` as admin)
- [ ] DB reachable from Vercel

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT in HttpOnly cookies
- Role and status checks in middleware and APIs
- Suspended / banned accounts blocked
- Never commit `.env` or secrets

---

## License

Private project — all rights reserved unless otherwise specified by the owner.
