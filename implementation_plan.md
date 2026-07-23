# Landing Page & Spacing Optimization, Footer Redesign, and Registration Verification

This plan outlines the design optimizations for the landing page sections and footer layout to achieve a professional visual balance, alongside tracing the admin portal registration request flows.

## Proposed Changes

### Spacing & Spacing optimization on Landing Page

#### [MODIFY] [LandingPageClient.tsx](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/app/LandingPageClient.tsx)
- Reduce overall top/bottom paddings of landing page sections (features, stats, brands, cars, hotel partners, company partners, call-to-action) from `py-16` / `pb-20` down to a compact, dense `py-10` / `py-8` / `pb-10`.
- Tweak margins around the Google Ad slots to ensure alignment and consistent whitespace distribution.

### Restyling the Footer

#### [MODIFY] [Footer.tsx](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/components/layout/Footer.tsx)
- Redesign the footer layout:
  - Tweak background to use a premium subtle dark-mode gradient backdrop (`bg-gradient-to-b from-dark-950 to-dark-990` / HSL curated colors) instead of plain card fill.
  - Decrease top margin of the footer block from `mt-28` to `mt-16` to remove the awkward gaps.
  - Tweak grid layout, column alignments, font weights, and hover colors (such as transitioning from slate to secondary/primary tones on hover) to make it visually eye-catching and premium.
  - Reduce bottom padding and copyright row offsets for a professional layout.

### Company Registration Verification

#### [INVESTIGATE] Company Registration
- Confirm that the Neon database receives new company submissions successfully and check whether they display under the "Company Approvals" and "User Management" tabs in the admin portal.
- Verify if any database synchronization or caching prevents the admin dashboard query from loading freshly registered PENDING companies.

## Verification Plan

### Automated Tests
- Build verification command: `npm run build`

### Manual Verification
- Deploy to local/staging dev environment.
- Register a test company account from the `/auth` page.
- Log in as `admin@drivehub.com` / `Admin@123` and inspect the "Company Approvals" tab in the admin dashboard to confirm the registration request shows up.
- Verify visual aesthetics and spacing of the landing page and footer under both light and dark themes.
