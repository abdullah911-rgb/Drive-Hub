# 🚗 DriveHub — Premium Car Rental Marketplace

[![Next.js Version](https://img.shields.io/badge/Next.js-15.5-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

DriveHub is a fully-featured, production-ready, global peer-to-peer and agency-level vehicle rental marketplace. Built with a modern, high-performance tech stack, it features secure user authentication, interactive search directories, direct WhatsApp integrations for bookings, premium company subscription setups, global localization, and an interactive admin portal with real-time SMTP and WhatsApp notification workflows.

---

## ✨ Key Features

* **🌐 Global Localization:** Multi-country structure (Pakistan, Saudi Arabia, UAE, etc.) with automated country-specific business license formats, currency conversion, dial codes, and flag matching.
* **🛡️ Secure User Authentication:** Role-based access control (`SUPER_ADMIN`, `ADMIN`, `COMPANY`, `CUSTOMER`) using secure, signed JWT tokens stored in HTTP-only cookies.
* **💼 Company Fleet Management:** Dedicated dashboard for companies to upload vehicles, manage active listings, and check customer feedback scores.
* **💳 Subscription System:** Automated 8500pkr/month subscription flow with admin-controlled bank wire transfers, Pakistani Safepay integrations, and Saudi Arabian Tap Payment APIs.
* **📋 Business License Verification:** Client-side and server-side format verification (FBR NTN validation for PK, 10-digit Commercial Registration verification for SA) with manual validation indicators.
* **✉️ Notification Dispatcher:** Real-time Gmail SMTP notifications and automated pre-formatted `wa.me` WhatsApp message generators triggering on all admin approval changes.
* **⚡ High Performance:** Next.js 15 routing, static generation optimization, fully optimized Prisma indexes, and query optimizations targeting N+1 loads.

---

## 🛠️ Tech Stack

* **Frontend Framework:** Next.js 15 (App Router with Server Actions & Client-side hydration)
* **Styling:** Tailwind CSS + Vanilla CSS & Framer Motion
* **Database & ORM:** PostgreSQL + Prisma Client
* **Authentication:** JWT (jose) + bcryptjs password hashing
* **Notification Engines:** Nodemailer (Gmail SMTP integration) + WhatsApp Direct Deep-Link Protocol
* **UI/UX Foundations:** Radix UI primitives + Sonner Toast Engine + Lucide React Icons

---

## 🚀 Local Development Setup

To run DriveHub locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd DriveHub
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env` (or `.env.local` for local Next.js overrides):
```bash
cp .env.example .env
```
Fill in your database URL and configurations:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/drivehub_db?schema=public"
JWT_SECRET="generate-a-32-character-random-secret"

# SMTP (Gmail Example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-16-char-app-password"
SMTP_FROM='"DriveHub Marketplace" <your-email@gmail.com>'

# Admin Account Credentials to seed
ADMIN_EMAIL="admin@drivehub.com"
ADMIN_PASSWORD="YourSecurePassword123!"
ADMIN_PHONE="+923001234567"
```

### 4. Push Database Schema & Seed Data
```bash
# Push database schemas to your local postgres instance
npm run db:push

# Run seed command to register Roles, Countries, Cities, and create your Admin user
npm run db:seed
```

### 5. Launch the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🚢 Deploying to Vercel

### 1. Provision a Cloud Database
Create a cloud-hosted PostgreSQL instance using providers like [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app). Copy the connection URI.

### 2. Import project to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and link your GitHub repository.
2. In **Environment Variables**, define the values from your `.env`:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL` (Set to your custom domain or `https://YOUR-APP.vercel.app`)
   - `NEXT_PUBLIC_APP_NAME` (`DriveHub Marketplace`)
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, etc.
3. Click **Deploy**.

### 3. Initialize Production Database (Once)
After your cloud database and Vercel build is deployed, seed your database schemas remotely using your terminal:
```bash
# Run from your local terminal with DATABASE_URL set to your cloud DB
npx prisma db push
npx prisma db seed
```

---

## 📁 Repository Structure

```
├── prisma/
│   ├── schema.prisma   # Main Database schema definition
│   └── seed.ts         # Initial system roles, countries, cities & admin seed script
├── src/
│   ├── app/
│   │   ├── api/        # REST Endpoints (admin, auth, cars, reviews, etc.)
│   │   ├── dashboard/  # Admin, Company, and Customer role dashboards
│   │   └── marketplace/# Public listings, vehicles details, and directories
│   ├── components/     # UI Elements (layout components, shared forms, design systems)
│   ├── lib/            # Utility functions, core database connectors, and auth checks
│   └── types/          # Shared TypeScript type interfaces
├── public/             # System media files and brand logos
└── package.json        # Manifest file and automation scripts
```

---

## 📜 Available Command Scripts

| Script Command | Purpose |
|:---|:---|
| `npm run dev` | Starts the Next.js development server with hot-reloading |
| `npm run build` | Builds the optimized production build |
| `npm run start` | Runs the production build web-server |
| `npm run lint` | Runs ESLint codebase analysis |
| `npm run db:push` | Directly synchronizes the Prisma schema with the target database |
| `npm run db:seed` | Runs the database seed scripts (`prisma/seed.ts`) |
| `npm run db:studio` | Launches visual Prisma client inspector inside your browser |

---

## 🔒 Security Principles

* **Secrets:** Never commit `.env` or configuration secrets. Always use secret vaults in your cloud deployment settings.
* **Cookies:** Authentication uses secure `HttpOnly` and `SameSite` cookies to mitigate XSS and CSRF risks.
* **Passwords:** Passwords are fully hashed with 12-round `bcrypt` salting before database insertion.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
