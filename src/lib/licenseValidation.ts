/**
 * License number format validators per country.
 *
 * NOTE ON REAL VERIFICATION:
 * These validators check FORMAT only. Cross-verifying a business license
 * against a CNIC/Iqama requires an enterprise API partnership:
 *   - Pakistan: NADRA / SECP / 1Link vendor
 *   - Saudi Arabia: Ministry of Commerce (Sijilat API)
 *   - UAE: Ministry of Economy
 *
 * Without those APIs we perform the best possible format + heuristic checks.
 */

export interface LicenseValidationResult {
  valid: boolean
  error?: string
  warning?: string
  formatName?: string
}

type Validator = (license: string, cnicOrId?: string) => LicenseValidationResult

// ──────────────────────────────────────────────────────────────────────────────
// Per-country validators
// ──────────────────────────────────────────────────────────────────────────────

const PK: Validator = (license, cnic) => {
  const cleaned = license.replace(/[\s-]/g, '')

  // NTN: exactly 7 digits
  if (/^\d{7}$/.test(cleaned)) {
    const result: LicenseValidationResult = { valid: true, formatName: 'Pakistan NTN' }
    if (cnic) {
      const cleanCnic = cnic.replace(/[\s-]/g, '')
      if (cleanCnic.length !== 13) {
        result.warning = 'CNIC must be 13 digits (XXXXX-XXXXXXX-X). Please verify manually.'
      } else {
        result.warning = 'NTN format valid. Manual NADRA verification recommended before final approval.'
      }
    }
    return result
  }

  // SECP company registration: e.g. K-010345 or 0012345-6
  if (/^[A-Z]{1,3}-\d{4,8}$/i.test(license)) {
    return { valid: true, formatName: 'Pakistan SECP Registration' }
  }

  // Generic FBR / provincial registration: alphanumeric 6–20 chars
  if (/^[A-Z0-9]{6,20}$/i.test(cleaned)) {
    return { valid: true, formatName: 'Pakistan Business License', warning: 'Manual license verification recommended.' }
  }

  return {
    valid: false,
    error: 'Pakistan license must be a 7-digit NTN, SECP number (e.g. K-010345), or 6–20 alphanumeric characters.',
  }
}

const SA: Validator = (license) => {
  const cleaned = license.replace(/\s/g, '')
  // Saudi CR: 10 digits starting with 1 or 2
  if (/^[12]\d{9}$/.test(cleaned)) {
    return { valid: true, formatName: 'Saudi Arabia Commercial Registration (CR)' }
  }
  return {
    valid: false,
    error: 'Saudi Arabia CR number must be exactly 10 digits and start with 1 or 2 (e.g. 1010123456).',
  }
}

const AE: Validator = (license) => {
  const cleaned = license.replace(/[\s-]/g, '')
  // UAE TRN: 15 digits starting with 1
  if (/^1\d{14}$/.test(cleaned)) return { valid: true, formatName: 'UAE Tax Registration Number (TRN)' }
  // UAE Trade License: typically CN-XXXXXXXX
  if (/^CN-\d{7,9}$/i.test(license)) return { valid: true, formatName: 'UAE Trade License' }
  // Generic
  if (/^[A-Z0-9\-]{5,20}$/i.test(cleaned)) return { valid: true, formatName: 'UAE Business License', warning: 'Manual license verification recommended.' }
  return { valid: false, error: 'UAE license must be a TRN (15 digits), Trade License (CN-XXXXXXXX), or 5–20 alphanumeric characters.' }
}

const QA: Validator = (license) => {
  const cleaned = license.replace(/\s/g, '')
  if (/^\d{5,11}$/.test(cleaned)) return { valid: true, formatName: 'Qatar Commercial Registration' }
  return { valid: false, error: 'Qatar CR number should be 5–11 digits.' }
}

const GB: Validator = (license) => {
  const cleaned = license.replace(/\s/g, '')
  if (/^[A-Z]{2}\d{6}$/i.test(cleaned)) return { valid: true, formatName: 'UK Companies House Number' }
  if (/^[A-Z0-9\-]{5,20}$/i.test(cleaned)) return { valid: true, formatName: 'UK Business License' }
  return { valid: false, error: 'UK company number should be 2 letters + 6 digits (e.g. AB123456) or similar format.' }
}

const DEFAULT: Validator = (license) => {
  if (license.trim().length < 5) {
    return { valid: false, error: 'License number must be at least 5 characters.' }
  }
  if (!/^[A-Z0-9\-\/\s]{5,40}$/i.test(license)) {
    return { valid: false, error: 'License number contains invalid characters. Use letters, digits, hyphens, and slashes only.' }
  }
  return { valid: true, formatName: 'Business License' }
}

const VALIDATORS: Record<string, Validator> = { PK, SA, AE, QA, GB }

// ──────────────────────────────────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────────────────────────────────
export function validateLicenseNumber(
  licenseNumber: string,
  countryCode: string,
  cnicOrId?: string
): LicenseValidationResult {
  if (!licenseNumber || licenseNumber.trim().length === 0) {
    return { valid: false, error: 'License number is required.' }
  }
  const validator = VALIDATORS[countryCode.toUpperCase()] ?? DEFAULT
  return validator(licenseNumber, cnicOrId)
}

/**
 * Returns a human-readable description of the expected license format for a country.
 * Shown in the registration form as a hint.
 */
export function getLicenseFormatHint(countryCode: string): string {
  const hints: Record<string, string> = {
    PK: 'Enter your NTN (7 digits), SECP number (e.g. K-010345), or provincial license number.',
    SA: 'Enter your 10-digit Commercial Registration (CR) number starting with 1 or 2.',
    AE: 'Enter your TRN (15 digits starting with 1) or Trade License number (CN-XXXXXXXX).',
    QA: 'Enter your 5–11 digit Qatar Commercial Registration number.',
    GB: 'Enter your Companies House number (e.g. AB123456) or business license.',
    IN: 'Enter your CIN (Corporate Identification Number) or GSTIN.',
    US: 'Enter your EIN or State Business License number.',
    CA: 'Enter your Business Number (BN) or provincial registration.',
    AU: 'Enter your ABN (11 digits) or ACN (9 digits).',
  }
  return hints[countryCode.toUpperCase()] ?? 'Enter your official business license or registration number.'
}
