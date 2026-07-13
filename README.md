# DriveHub — Car & Hotel Rental Marketplace

[![Next.js](https://img.shields.io/badge/Next.js-15.5-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

DriveHub is a full-stack marketplace for **car rentals** and **hotel rooms**. Customers browse verified listings, compare options, and contact providers directly on WhatsApp. Rental companies and hotels manage fleets, rooms, subscriptions, and approvals through role-based dashboards.

> **Note:** DriveHub is a listing and discovery platform. Bookings, payments, and agreements happen directly between customers and providers.

---

## Table of Contents

- [Key Features](#-key-features)
- [User Roles](#-user-roles)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Scripts](#-database-scripts)
- [API Overview](#-api-overview)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Security](#-security)

---

## Key Features

### Marketplace (Public)
- Browse **cars** and **hotel rooms** with filters (country, city, brand, fuel type, transmission, capacity)
- Company directory with profiles, ratings, and reviews
- Direct **WhatsApp** contact links for every listing
- Landing page with featured cars, partners, and room listings
- Light / dark theme toggle
- **PWA** support — installable on mobile and desktop
- SEO: sitemap, robots.txt, Open Graph images, JSON-LD structured data

### Authentication & Authorization
- JWT authentication via **HTTP-only cookies** (`jose` + `bcryptjs`)
- Role-based access enforced in middleware and API routes
- Customer, company, hotel, admin, and super-admin flows
- Account approval workflow (`PENDING` → `APPROVED` / `REJECTED`)

### Company & Hotel Management
- Company registration with document uploads and license validation
- **Car rental** fleet management (images, documents, specs)
- **Hotel** room listings (type, price per night, amenities, images)
- Company types: `CAR_RENTAL` and `HOTEL`
- Customer-to-company upgrade (register a business from customer account)

### Admin Portal
- Approve / reject / suspend users, companies, cars, and rooms
- Subscription and payment verification
- Platform bank details management
- Admin action logs and audit trails
- In-app notifications + email alerts (SMTP)
- Dashboard stats (users, listings, revenue by currency)

### Subscriptions & Payments
- Monthly company subscription (base price: **PKR 8,500** / month)
- Multi-currency display via live conversion API
- Bank transfer submission with admin verification
- Payment provider hooks: `mock`, `rapid_gateway`, `moyasar`
- Payment methods: JazzCash, EasyPaisa, card, Apple Pay, Mada (region-dependent)

### Global Localization
- **25+ countries** with cities, dial codes, flags, and currencies
- Country-specific form validation (e.g. FBR NTN for Pakistan, CR for Saudi Arabia)
- Currency conversion endpoint for subscription pricing

### Notifications
- In-app notification system (approvals, reviews, payments, subscriptions)
- Gmail SMTP email notifications via Nodemailer
- Pre-formatted WhatsApp deep links for admin outreach

---

## User Roles

| Role | Access |
|------|--------|
| `CUSTOMER` | Browse marketplace, leave reviews, register a company |
| `COMPANY` | Car rental dashboard — manage cars, subscriptions, profile |
| `HOTEL` | Hotel dashboard — manage rooms, subscriptions, profile |
| `ADMIN` | Admin portal — approvals, payments, platform settings |
| `SUPER_ADMIN` | Full admin access (seeded on first deploy) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3, custom CSS variables, Framer Motion |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | JWT (`jose`), bcrypt password hashing, cookie sessions |
| Email | Nodemailer (Gmail SMTP) |
| UI Feedback | Sonner toasts |
| Theming | next-themes (light / dark) |
| Images | Next.js Image + Sharp |
| PWA | Web manifest + service worker |
| Deployment | Vercel (with Prisma generate in build) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or cloud)
- npm

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd "Car Rental"
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database URL, JWT secret, SMTP credentials, and admin seed values. See [Environment Variables](#-environment-variables) below.

### 3. Set up the database

```bash
# Push schema + seed roles, countries, cities, and admin user
npm run db:setup
```

Or step by step:

```bash
npm run db:push
npm run db:seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (32+ chars) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public site URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME` | No | Display name (default: `DriveHub Marketplace`) |
| `ADMIN_EMAIL` | Seed | Email for the first super-admin account |
| `ADMIN_PASSWORD` | Seed | Password for the first super-admin account |
| `ADMIN_PHONE` | Seed | Phone number for the admin user |
| `SMTP_HOST` | Email | SMTP host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Email | SMTP port (e.g. `587`) |
| `SMTP_USER` | Email | SMTP username |
| `SMTP_PASS` | Email | SMTP password / app password |
| `SMTP_FROM` | Email | From address for outgoing mail |

Example `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/car_rental_db?schema=public"
JWT_SECRET="your-long-random-secret-here"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="DriveHub Marketplace"

ADMIN_EMAIL="admin@drivehub.com"
ADMIN_PASSWORD="YourSecurePassword123!"
ADMIN_PHONE="+923001234567"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM='"DriveHub Marketplace" <your-email@gmail.com>'
```

---

## Database Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database (no migration files) |
| `npm run db:migrate` | Create and apply Prisma migrations |
| `npm run db:seed` | Seed roles, countries, cities, admin user |
| `npm run db:setup` | `db:push` + `db:seed` in one step |
| `npm run db:purge-demo` | Remove demo / test data |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a customer |
| POST | `/api/auth/register-company` | Register a company / hotel |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current session user |

### Marketplace (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cars` | List cars (filters, pagination) |
| GET | `/api/cars/[id]` | Car details |
| POST | `/api/cars` | Create car (company) |
| PATCH | `/api/cars/[id]` | Update car |
| GET | `/api/rooms` | List hotel rooms |
| GET | `/api/rooms/[id]` | Room details |
| POST | `/api/rooms` | Create room (hotel) |
| PATCH | `/api/rooms/[id]` | Update room |
| DELETE | `/api/rooms/[id]` | Delete room |
| GET | `/api/companies` | List companies |
| GET | `/api/companies/[id]` | Company profile |
| GET | `/api/reviews` | List reviews |
| POST | `/api/reviews` | Submit a review |
| GET | `/api/countries` | List countries |
| GET | `/api/cities` | List cities |
| GET | `/api/currency` | Currency conversion |

### Authenticated
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | User notifications |
| PATCH | `/api/notifications` | Mark notifications read |
| GET | `/api/subscriptions` | List subscriptions (admin) |
| POST | `/api/subscriptions` | Create subscription (company) |
| GET | `/api/bank-details` | Platform bank details |
| PATCH | `/api/bank-details` | Update bank details (admin) |
| GET | `/api/admin` | Admin stats and data |
| PATCH | `/api/admin` | Admin actions (approve, reject, etc.) |

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database models and enums
│   ├── seed.ts            # Roles, countries, cities, admin user
│   └── purge-demo.ts      # Demo data cleanup script
├── public/
│   └── sw.js              # Service worker for PWA
├── src/
│   ├── app/
│   │   ├── api/           # REST API route handlers
│   │   ├── auth/          # Login & registration pages
│   │   ├── dashboard/
│   │   │   ├── admin/     # Admin portal
│   │   │   ├── company/   # Car rental company dashboard
│   │   │   └── hotel/     # Hotel dashboard
│   │   ├── marketplace/
│   │   │   ├── cars/      # Car listings & detail pages
│   │   │   ├── rooms/     # Hotel room listings
│   │   │   └── companies/ # Company directory
│   │   ├── about/         # About page
│   │   ├── contact/       # Contact page
│   │   ├── privacy/       # Privacy policy
│   │   ├── terms/         # Terms & conditions
│   │   ├── globals.css    # Global styles & design tokens
│   │   ├── layout.tsx     # Root layout (theme, toasts, PWA)
│   │   ├── page.tsx       # Landing page (server)
│   │   └── LandingPageClient.tsx
│   ├── components/
│   │   ├── layout/        # Navbar, Footer
│   │   ├── shared/        # Cards, forms, modals, uploads
│   │   ├── seo/           # JSON-LD helpers
│   │   └── ui/            # Reusable UI primitives
│   ├── hooks/             # Custom React hooks (PWA install, etc.)
│   ├── lib/               # Auth, DB, email, currency, validation
│   ├── types/             # Shared TypeScript interfaces
│   └── middleware.ts      # JWT route protection
├── .env.example           # Environment variable template
├── next.config.ts
├── tailwind.config.ts
├── vercel.json
└── package.json
```

---

## Deployment

### Vercel (recommended)

1. **Create a PostgreSQL database** on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app).
2. **Import the repo** at [vercel.com/new](https://vercel.com/new).
3. **Set environment variables** from `.env.example` in the Vercel dashboard.
4. **Deploy** — `vercel.json` runs `prisma generate` before build.
5. **Seed production database once:**

```bash
DATABASE_URL="your-production-url" npx prisma db push
DATABASE_URL="your-production-url" npx prisma db seed
```

### Post-deploy checklist

- [ ] `JWT_SECRET` is a strong random value
- [ ] `NEXT_PUBLIC_APP_URL` matches your live domain
- [ ] Admin credentials are set and seed has run
- [ ] SMTP is configured for email notifications
- [ ] Database is reachable from Vercel (use connection pooling if on Neon)

---

## Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWT stored in **HttpOnly**, **SameSite** cookies
- Role and account-status checks in middleware and API handlers
- Banned / suspended accounts blocked at the middleware layer
- Never commit `.env` files or secrets to version control
- Use Vercel environment variables or a secrets manager in production

---

## Supported Countries (seed data)

Pakistan, India, Bangladesh, Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman, Egypt, Turkey, United States, Canada, Brazil, Mexico, United Kingdom, Germany, France, Italy, Spain, Netherlands, Australia, Malaysia, Singapore, Japan, South Africa — each with major cities.

---

## License

Private project — all rights reserved unless otherwise specified by the repository owner.
