# Implementation Plan - Hotel Partner Registration and Landing Page Display

Update the business registration form so that registering as a hotel does not ask for or require a vehicle license or license documents. Display hotel partners on the landing page, and show their rooms on their company profile page.

## User Review Required

> [!IMPORTANT]
> - **License Form Field and Document Uploads**: Selecting "Hotel" during registration will hide the "License Number" text input and the two license document uploads.
> - **Database Consistency**: Since the database schema requires a `licenseNumber` for all companies, we will default it to `N/A` for hotel registrations in the backend to ensure compatibility without running database migrations.
> - **Landing Page Layout**: A new "Hotel Partners" section will be added to the landing page alongside the existing "Trusted Partners" (renamed to "Car Rental Partners") section.
> - **Company Profile**: Opening a hotel company's profile will list its active Rooms using a newly defined `RoomCard` component, instead of Cars.

## Proposed Changes

---

### 1. Form Validation and Helpers

#### [MODIFY] [companyDocuments.ts](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/lib/companyDocuments.ts)
- Modify `validateCompanyDocuments(docs, isHotel?: boolean)` to skip checking for `LICENSE_FRONT` and `LICENSE_BACK` if `isHotel` is true.

#### [MODIFY] [countryFormConfig.ts](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/lib/countryFormConfig.ts)
- Modify `validateCompanyForm(countryCode, data, isHotel?: boolean)` to skip checking for `businessLicense` if `isHotel` is true.

---

### 2. Registration API Routes and Request parsing

#### [MODIFY] [registerCompany.ts](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/lib/registerCompany.ts)
- Update `ParsedCompanyRegistration` types to accept a `Partial` document list.
- In `parseCompanyRegistrationRequest`, check if `companyType === 'HOTEL'`. If it is:
  - Do not require `licenseNumber` (default to `'N/A'`).
  - Do not require `LICENSE_FRONT` and `LICENSE_BACK` files.
- In `saveCompanyRegistrationDocuments`, only save files that are present in the parsed documents object.

#### [MODIFY] [register-company/route.ts](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/app/api/auth/register-company/route.ts)
- Pass `companyType === 'HOTEL'` to `validateCompanyForm`.
- Skip `validateLicenseNumber` validation if `companyType === 'HOTEL'`.

#### [MODIFY] [register/route.ts](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/app/api/auth/register/route.ts)
- Pass `companyType === 'HOTEL'` to `validateCompanyForm`.
- Skip `validateLicenseNumber` validation if `companyType === 'HOTEL'`.

---

### 3. Companies API Endpoints

#### [MODIFY] [companies/route.ts](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/app/api/companies/route.ts)
- Support filtering by `companyType` query parameter (`CAR_RENTAL` | `HOTEL`).
- Include `companyType` and `rooms` count in the Prisma queries.
- Enrich company records to return `totalRooms` and `companyType`.

#### [MODIFY] [companies/[id]/route.ts](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/app/api/companies/[id]/route.ts)
- Support owner validation check for user role `'HOTEL'` in addition to `'COMPANY'`.
- Query and include `rooms` (with images, city, and country) in the company profile retrieval.
- Return `totalRooms` in the response payload.

---

### 4. Frontend Components & Interface

#### [MODIFY] [CompanyFormFields.tsx](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/components/shared/CompanyFormFields.tsx)
- Add optional `companyType?: 'CAR_RENTAL' | 'HOTEL'` prop.
- If `companyType === 'HOTEL'`, hide the license input field and render the national ID field as single column.

#### [MODIFY] [CompanyDocumentUploads.tsx](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/components/shared/CompanyDocumentUploads.tsx)
- Add optional `companyType?: 'CAR_RENTAL' | 'HOTEL'` prop.
- If `companyType === 'HOTEL'`, filter out `LICENSE_FRONT` and `LICENSE_BACK` and only render ID uploads.

#### [MODIFY] [RegisterCompanyModal.tsx](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/components/shared/RegisterCompanyModal.tsx)
- Pass `companyType` to `CompanyFormFields` and `CompanyDocumentUploads`.
- Pass `companyType === 'HOTEL'` to validation functions (`validateCompanyForm` and `validateCompanyDocuments`).

#### [MODIFY] [auth/page.tsx](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/app/auth/page.tsx)
- Pass `companyType` to `CompanyFormFields` and `CompanyDocumentUploads`.
- Pass `companyType === 'HOTEL'` to validation functions (`validateCompanyForm` and `validateCompanyDocuments`).

#### [MODIFY] [Cards.tsx](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/components/shared/Cards.tsx)
- Export new component `RoomCard` using premium glassmorphism styling.
- Update `CompanyCard` to show `🏨 {totalRooms} Rooms` instead of cars if `companyType === 'HOTEL'`.

#### [MODIFY] [LandingPageClient.tsx](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/app/LandingPageClient.tsx)
- Retrieve companies and rooms.
- Partition companies into `carCompanies` and `hotelCompanies`.
- Render a new "Hotel Partners" section on the landing page below the car partners.

#### [MODIFY] [CompanyDetailClient.tsx](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/app/marketplace/companies/[id]/CompanyDetailClient.tsx)
- Import `RoomCard` and check `company.companyType`.
- If `companyType === 'HOTEL'`, show active listings tab as "Rooms" and render rooms with `RoomCard` components.
- Check role `'HOTEL'` for owner badge/editing permissions.

#### [MODIFY] [marketplace/companies/page.tsx](file:///c:/Users/SHUAIB%20LAPTOP/Desktop/Car%20Rental/src/app/marketplace/companies/page.tsx)
- Add a category filter tab at the top: "All Partners", "Car Rentals", and "Hotels".
- Dynamically filter and query `/api/companies` using the selection.

---

## Verification Plan

### Automated Tests / Compile Checks
- Run `npm run build` to verify Next.js builds successfully.
- Run `npm run lint` to check for code format/lint errors.

### Manual Verification
1. **Register as a Hotel**: Go to signup/registration, select "Hotel" type, verify that license field and license document uploads are hidden. Complete registration.
2. **Admin Approval**: Check how the registered hotel appears in the Admin flow (should show documents and name). Approve the hotel.
3. **Verify Landing Page**: Open the landing page, check if the registered hotel company appears under the new "Hotel Partners" section.
4. **Verify Room Listings**: Open the hotel partner profile, verify that it shows the list of active rooms.
