
export type FieldConfig = {
  label: string
  placeholder: string
  hint: string
  example: string
  pattern: RegExp
  maxLength?: number
  format?: (value: string) => string
}

export type CountryRegistrationConfig = {
  code: string
  nationalId: FieldConfig
  businessLicense: FieldConfig
  phone: FieldConfig
  address: FieldConfig
  documentHint: string
}

const DEFAULT: CountryRegistrationConfig = {
  code: 'DEFAULT',
  nationalId: {
    label: 'National ID',
    placeholder: 'Enter your national ID',
    hint: 'Government-issued identification number',
    example: 'AB1234567',
    pattern: /^[A-Za-z0-9\-]{5,20}$/,
    maxLength: 20,
  },
  businessLicense: {
    label: 'Business License',
    placeholder: 'Enter license number',
    hint: 'Valid business or operator license',
    example: 'LIC-2024-001',
    pattern: /^[A-Za-z0-9\-\/]{4,25}$/,
    maxLength: 25,
  },
  phone: {
    label: 'Phone Number',
    placeholder: '+XX XXX XXX XXXX',
    hint: 'Include country code',
    example: '+1 555 123 4567',
    pattern: /^\+?[\d\s\-()]{8,18}$/,
    maxLength: 18,
  },
  address: {
    label: 'Business Address',
    placeholder: 'Street, city, postal code',
    hint: 'Full registered business address',
    example: '123 Main Street, City',
    pattern: /^.{10,200}$/,
  },
  documentHint: 'Upload front and back of your ID and business license during registration.',
}

function digitsOnly(v: string) {
  return v.replace(/\D/g, '')
}

function formatPKCnic(value: string): string {
  const d = digitsOnly(value).slice(0, 13)
  if (d.length <= 5) return d
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`
}

function formatUAEId(value: string): string {
  const d = digitsOnly(value).slice(0, 15)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 14) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 14)}-${d.slice(14)}`
}

function formatUSPhone(value: string): string {
  const d = digitsOnly(value)
  if (!d.startsWith('1') && d.length <= 10) {
    const n = d.slice(0, 10)
    if (n.length <= 3) return n.length ? `+1 (${n}` : ''
    if (n.length <= 6) return `+1 (${n.slice(0, 3)}) ${n.slice(3)}`
    return `+1 (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`
  }
  const n = d.startsWith('1') ? d.slice(1, 11) : d.slice(0, 10)
  if (n.length <= 3) return `+1 (${n}`
  if (n.length <= 6) return `+1 (${n.slice(0, 3)}) ${n.slice(3)}`
  return `+1 (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`
}

function formatGBPhone(value: string): string {
  const d = digitsOnly(value)
  const n = d.startsWith('44') ? d.slice(2) : d
  if (n.length <= 4) return n.length ? `+44 ${n}` : ''
  if (n.length <= 7) return `+44 ${n.slice(0, 4)} ${n.slice(4)}`
  return `+44 ${n.slice(0, 4)} ${n.slice(4, 10)}`
}

function formatGBNi(value: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (clean.length <= 2) return clean
  if (clean.length <= 4) return `${clean.slice(0, 2)} ${clean.slice(2)}`
  if (clean.length <= 6) return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4)}`
  if (clean.length <= 8) return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6)}`
  return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 9)}`
}

function formatINPhone(value: string): string {
  const d = digitsOnly(value)
  const n = d.startsWith('91') ? d.slice(2, 12) : d.slice(0, 10)
  if (n.length <= 5) return n.length ? `+91 ${n}` : ''
  return `+91 ${n.slice(0, 5)} ${n.slice(5)}`
}

function formatSAPhone(value: string): string {
  const d = digitsOnly(value)
  const n = d.startsWith('966') ? d.slice(3, 12) : d.slice(0, 9)
  if (n.length <= 2) return n.length ? `+966 ${n}` : ''
  if (n.length <= 5) return `+966 ${n.slice(0, 2)} ${n.slice(2)}`
  return `+966 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`
}

function formatAEPhone(value: string): string {
  const d = digitsOnly(value)
  const n = d.startsWith('971') ? d.slice(3, 12) : d.slice(0, 9)
  if (n.length <= 2) return n.length ? `+971 ${n}` : ''
  if (n.length <= 5) return `+971 ${n.slice(0, 2)} ${n.slice(2)}`
  return `+971 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`
}

function formatPKPhone(value: string): string {
  const d = digitsOnly(value)
  const n = d.startsWith('92') ? d.slice(2, 12) : d.slice(0, 10)
  if (n.length <= 3) return n.length ? `+92 ${n}` : ''
  if (n.length <= 6) return `+92 ${n.slice(0, 3)} ${n.slice(3)}`
  return `+92 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
}

function formatAUPhone(value: string): string {
  const d = digitsOnly(value)
  const n = d.startsWith('61') ? d.slice(2, 11) : d.slice(0, 9)
  if (n.length <= 3) return n.length ? `+61 ${n}` : ''
  if (n.length <= 6) return `+61 ${n.slice(0, 3)} ${n.slice(3)}`
  return `+61 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
}

function formatDEPhone(value: string): string {
  const d = digitsOnly(value)
  const n = d.startsWith('49') ? d.slice(2, 13) : d.slice(0, 11)
  if (n.length <= 3) return n.length ? `+49 ${n}` : ''
  if (n.length <= 7) return `+49 ${n.slice(0, 3)} ${n.slice(3)}`
  return `+49 ${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}`
}

function formatDialPhone(value: string, dialCode: string, nationalMax: number): string {
  const dialDigits = dialCode.replace(/\D/g, '')
  let d = digitsOnly(value)
  if (d.startsWith(dialDigits)) d = d.slice(dialDigits.length)
  d = d.slice(0, nationalMax)
  if (!d.length) return ''
  const groups: string[] = []
  if (d.length <= 4) return `${dialCode} ${d}`
  groups.push(d.slice(0, d.length > 8 ? 2 : 4))
  let i = d.length > 8 ? 2 : 4
  while (i < d.length) {
    groups.push(d.slice(i, i + 3))
    i += 3
  }
  return `${dialCode} ${groups.join(' ')}`
}

function formatBRPhone(value: string): string {
  const d = digitsOnly(value)
  const n = d.startsWith('55') ? d.slice(2, 13) : d.slice(0, 11)
  if (n.length <= 2) return n.length ? `+55 (${n}` : ''
  if (n.length <= 7) return `+55 (${n.slice(0, 2)}) ${n.slice(2)}`
  return `+55 (${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

function formatMXPhone(value: string): string {
  const d = digitsOnly(value)
  const n = d.startsWith('52') ? d.slice(2, 12) : d.slice(0, 10)
  if (n.length <= 3) return n.length ? `+52 ${n}` : ''
  if (n.length <= 6) return `+52 ${n.slice(0, 3)} ${n.slice(3)}`
  return `+52 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
}

export const COUNTRY_FORM_CONFIGS: Record<string, CountryRegistrationConfig> = {
  PK: {
    code: 'PK',
    nationalId: {
      label: 'CNIC',
      placeholder: '42101-1234567-1',
      hint: 'Pakistani CNIC format: 5 digits - 7 digits - 1 check digit',
      example: '42101-1234567-1',
      pattern: /^\d{5}-\d{7}-\d$/,
      maxLength: 15,
      format: formatPKCnic,
    },
    businessLicense: {
      label: 'Vehicle Rental License',
      placeholder: 'LIC-2024-001',
      hint: 'Issued by provincial transport authority',
      example: 'LIC-2024-001',
      pattern: /^[A-Za-z]{2,5}-\d{4}-\d{2,5}$/,
      maxLength: 20,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+92 300 1234567',
      hint: 'Pakistani mobile — starts with 03XX locally or +92 3XX',
      example: '+92 300 1234567',
      pattern: /^\+92\s?3\d{2}\s?\d{3}\s?\d{4,5}$/,
      maxLength: 18,
      format: formatPKPhone,
    },
    address: {
      label: 'Business Address',
      placeholder: 'Shop 12, Tariq Road, Karachi',
      hint: 'Include area, street, and city',
      example: 'Shop 12, Tariq Road, Karachi',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload front and back of CNIC and vehicle rental license during registration.',
  },

  SA: {
    code: 'SA',
    nationalId: {
      label: 'National ID / Iqama',
      placeholder: '1234567890',
      hint: '10-digit Saudi National ID or Iqama number',
      example: '1234567890',
      pattern: /^\d{10}$/,
      maxLength: 10,
      format: (v) => digitsOnly(v).slice(0, 10),
    },
    businessLicense: {
      label: 'Commercial Registration (CR)',
      placeholder: '1010123456',
      hint: 'Ministry of Commerce CR number — 10 digits',
      example: '1010123456',
      pattern: /^\d{10}$/,
      maxLength: 10,
      format: (v) => digitsOnly(v).slice(0, 10),
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+966 50 123 4567',
      hint: 'Saudi mobile numbers start with 05 locally or +966 5',
      example: '+966 50 123 4567',
      pattern: /^\+966\s?5\d\s?\d{3}\s?\d{4}$/,
      maxLength: 18,
      format: formatSAPhone,
    },
    address: {
      label: 'Business Address',
      placeholder: 'King Fahd Road, Riyadh 12345',
      hint: 'Street, district, city and postal code',
      example: 'King Fahd Road, Riyadh 12345',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload National ID/Iqama and CR certificate after approval.',
  },

  AE: {
    code: 'AE',
    nationalId: {
      label: 'Emirates ID',
      placeholder: '784-1990-1234567-1',
      hint: '15-digit Emirates ID: 784-YYYY-XXXXXXX-X',
      example: '784-1990-1234567-1',
      pattern: /^784-\d{4}-\d{7}-\d$/,
      maxLength: 18,
      format: formatUAEId,
    },
    businessLicense: {
      label: 'Trade License Number',
      placeholder: 'CN-1234567',
      hint: 'DED or free zone trade license number',
      example: 'CN-1234567',
      pattern: /^[A-Za-z]{2,4}-?\d{5,10}$/,
      maxLength: 15,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+971 50 123 4567',
      hint: 'UAE mobile — starts with 05 locally or +971 5X',
      example: '+971 50 123 4567',
      pattern: /^\+971\s?5\d\s?\d{3}\s?\d{4}$/,
      maxLength: 18,
      format: formatAEPhone,
    },
    address: {
      label: 'Business Address',
      placeholder: 'Office 204, Business Bay, Dubai',
      hint: 'Building, area, emirate',
      example: 'Office 204, Business Bay, Dubai',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload Emirates ID and trade license from your dashboard after approval.',
  },

  GB: {
    code: 'GB',
    nationalId: {
      label: 'National Insurance (NI) Number',
      placeholder: 'QQ 12 34 56 C',
      hint: 'Format: 2 letters, 6 digits, 1 letter (e.g. QQ 12 34 56 C)',
      example: 'QQ 12 34 56 C',
      pattern: /^[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]$/i,
      maxLength: 13,
      format: formatGBNi,
    },
    businessLicense: {
      label: 'Operator Licence Number',
      placeholder: 'OL123456',
      hint: 'DVSA or local authority vehicle operator licence',
      example: 'OL123456',
      pattern: /^[A-Za-z]{2}\d{5,8}$/,
      maxLength: 12,
    },
    phone: {
      label: 'Contact Number',
      placeholder: '+44 7700 900123',
      hint: 'UK mobile numbers typically start with 07 or +44 7',
      example: '+44 7700 900123',
      pattern: /^\+44\s?\d{4}\s?\d{6}$/,
      maxLength: 16,
      format: formatGBPhone,
    },
    address: {
      label: 'Business Address',
      placeholder: '42 High Street, Manchester, M1 1AA',
      hint: 'Street, city, and postcode',
      example: '42 High Street, Manchester, M1 1AA',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload NI proof and operator licence documents after approval.',
  },

  US: {
    code: 'US',
    nationalId: {
      label: 'EIN / Owner SSN',
      placeholder: '12-3456789',
      hint: 'Employer Identification Number (EIN) or owner SSN for sole proprietors',
      example: '12-3456789',
      pattern: /^(\d{2}-\d{7}|\d{3}-\d{2}-\d{4})$/,
      maxLength: 11,
      format: (v) => {
        const d = digitsOnly(v).slice(0, 9)
        if (d.length <= 2) return d
        if (d.length <= 9 && d.length > 2) return `${d.slice(0, 2)}-${d.slice(2)}`
        return v
      },
    },
    businessLicense: {
      label: 'State Business License',
      placeholder: 'CA-VR-123456',
      hint: 'State-issued vehicle rental or business license number',
      example: 'CA-VR-123456',
      pattern: /^[A-Za-z]{2}-[A-Za-z]{2,4}-\d{4,8}$/,
      maxLength: 18,
    },
    phone: {
      label: 'Phone Number',
      placeholder: '+1 (555) 123-4567',
      hint: 'US phone number with area code',
      example: '+1 (555) 123-4567',
      pattern: /^\+1\s?\(\d{3}\)\s?\d{3}-\d{4}$/,
      maxLength: 18,
      format: formatUSPhone,
    },
    address: {
      label: 'Business Address',
      placeholder: '123 Main St, Los Angeles, CA 90001',
      hint: 'Street, city, state, and ZIP code',
      example: '123 Main St, Los Angeles, CA 90001',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload EIN/SSN verification and state license after approval.',
  },

  IN: {
    code: 'IN',
    nationalId: {
      label: 'PAN / Aadhaar',
      placeholder: 'ABCDE1234F',
      hint: 'PAN card (ABCDE1234F) or 12-digit Aadhaar number',
      example: 'ABCDE1234F',
      pattern: /^([A-Z]{5}\d{4}[A-Z]|\d{12})$/i,
      maxLength: 12,
      format: (v) => {
        const d = digitsOnly(v)
        if (d.length === 12) return d
        return v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
      },
    },
    businessLicense: {
      label: 'Rental Business Permit',
      placeholder: 'DL-01-1234567',
      hint: 'State transport department rental permit number',
      example: 'DL-01-1234567',
      pattern: /^[A-Za-z]{2}-\d{2}-\d{5,10}$/,
      maxLength: 16,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+91 98765 43210',
      hint: 'Indian mobile — 10 digits starting with 6–9',
      example: '+91 98765 43210',
      pattern: /^\+91\s?[6-9]\d{4}\s?\d{5}$/,
      maxLength: 16,
      format: formatINPhone,
    },
    address: {
      label: 'Business Address',
      placeholder: 'Shop 5, Connaught Place, New Delhi 110001',
      hint: 'Street, area, city, and PIN code',
      example: 'Shop 5, Connaught Place, New Delhi 110001',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload PAN/Aadhaar and rental permit from dashboard after approval.',
  },

  CA: {
    code: 'CA',
    nationalId: {
      label: 'Business Number (BN)',
      placeholder: '123456789RC0001',
      hint: 'CRA Business Number — 9 digits + program ID',
      example: '123456789RC0001',
      pattern: /^\d{9}[A-Za-z]{2}\d{4}$/,
      maxLength: 15,
      format: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15),
    },
    businessLicense: {
      label: 'Provincial Operator Licence',
      placeholder: 'ON-VR-2024-00123',
      hint: 'Provincial vehicle rental operator licence',
      example: 'ON-VR-2024-00123',
      pattern: /^[A-Za-z]{2}-[A-Za-z]{2}-\d{4}-\d{4,6}$/,
      maxLength: 20,
    },
    phone: {
      label: 'Phone Number',
      placeholder: '+1 (416) 555-0123',
      hint: 'Canadian phone number with area code',
      example: '+1 (416) 555-0123',
      pattern: /^\+1\s?\(\d{3}\)\s?\d{3}-\d{4}$/,
      maxLength: 18,
      format: formatUSPhone,
    },
    address: {
      label: 'Business Address',
      placeholder: '100 King St W, Toronto, ON M5X 1A1',
      hint: 'Street, city, province, and postal code',
      example: '100 King St W, Toronto, ON M5X 1A1',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload BN registration and provincial licence after approval.',
  },

  AU: {
    code: 'AU',
    nationalId: {
      label: 'ABN',
      placeholder: '12 345 678 901',
      hint: '11-digit Australian Business Number',
      example: '12 345 678 901',
      pattern: /^\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$/,
      maxLength: 14,
      format: (v) => {
        const d = digitsOnly(v).slice(0, 11)
        if (d.length <= 2) return d
        if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`
        if (d.length <= 8) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`
        return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
      },
    },
    businessLicense: {
      label: 'Operator Accreditation',
      placeholder: 'NSW-VR-12345',
      hint: 'State transport operator accreditation number',
      example: 'NSW-VR-12345',
      pattern: /^[A-Za-z]{2,3}-[A-Za-z]{2}-\d{4,6}$/,
      maxLength: 16,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+61 412 345 678',
      hint: 'Australian mobile — starts with 04 locally or +61 4',
      example: '+61 412 345 678',
      pattern: /^\+61\s?4\d{2}\s?\d{3}\s?\d{3}$/,
      maxLength: 16,
      format: formatAUPhone,
    },
    address: {
      label: 'Business Address',
      placeholder: 'Level 2, 100 George St, Sydney NSW 2000',
      hint: 'Street, suburb, state, and postcode',
      example: 'Level 2, 100 George St, Sydney NSW 2000',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload ABN registration and operator accreditation after approval.',
  },

  DE: {
    code: 'DE',
    nationalId: {
      label: 'Personalausweisnummer',
      placeholder: 'T22000129',
      hint: 'German ID card number (Personalausweis) or passport number',
      example: 'T22000129',
      pattern: /^[A-Z0-9]{6,12}$/i,
      maxLength: 12,
      format: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12),
    },
    businessLicense: {
      label: 'Gewerbeschein Nummer',
      placeholder: 'G-12345678',
      hint: 'Trade licence (Gewerbeschein) registration number',
      example: 'G-12345678',
      pattern: /^[A-Za-z]-?\d{6,10}$/,
      maxLength: 12,
    },
    phone: {
      label: 'Telefonnummer',
      placeholder: '+49 170 1234567',
      hint: 'German mobile — starts with 01X or +49 1XX',
      example: '+49 170 1234567',
      pattern: /^\+49\s?1\d{2,3}\s?\d{6,8}$/,
      maxLength: 18,
      format: formatDEPhone,
    },
    address: {
      label: 'Geschäftsadresse',
      placeholder: 'Musterstraße 1, 10115 Berlin',
      hint: 'Straße, PLZ und Stadt',
      example: 'Musterstraße 1, 10115 Berlin',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Laden Sie Personalausweis und Gewerbeschein nach der Freigabe hoch.',
  },

  QA: {
    code: 'QA',
    nationalId: {
      label: 'Qatar ID (QID)',
      placeholder: '28512345678',
      hint: '11-digit Qatar ID number',
      example: '28512345678',
      pattern: /^\d{11}$/,
      maxLength: 11,
      format: (v) => digitsOnly(v).slice(0, 11),
    },
    businessLicense: {
      label: 'Commercial Registration',
      placeholder: 'CR-123456',
      hint: 'Ministry of Commerce CR number',
      example: 'CR-123456',
      pattern: /^CR-?\d{5,8}$/i,
      maxLength: 12,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+974 3312 3456',
      hint: 'Qatar mobile — +974 followed by 8 digits',
      example: '+974 3312 3456',
      pattern: /^\+974\s?\d{4}\s?\d{4}$/,
      maxLength: 16,
      format: (v) => formatDialPhone(v, '+974', 8),
    },
    address: {
      label: 'Business Address',
      placeholder: 'Al Sadd, Doha',
      hint: 'Area, street, and city in Qatar',
      example: 'Al Sadd, Doha',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload QID and commercial registration after approval.',
  },

  KW: {
    code: 'KW',
    nationalId: {
      label: 'Civil ID',
      placeholder: '285051234567',
      hint: '12-digit Kuwait Civil ID',
      example: '285051234567',
      pattern: /^\d{12}$/,
      maxLength: 12,
      format: (v) => digitsOnly(v).slice(0, 12),
    },
    businessLicense: {
      label: 'Commercial Licence',
      placeholder: '123456',
      hint: 'Ministry of Commerce licence number',
      example: '123456',
      pattern: /^\d{5,8}$/,
      maxLength: 8,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+965 5123 4567',
      hint: 'Kuwait mobile — +965 followed by 8 digits',
      example: '+965 5123 4567',
      pattern: /^\+965\s?\d{4}\s?\d{4}$/,
      maxLength: 16,
      format: (v) => formatDialPhone(v, '+965', 8),
    },
    address: {
      label: 'Business Address',
      placeholder: 'Salmiya, Kuwait City',
      hint: 'Area and governorate',
      example: 'Salmiya, Kuwait City',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload Civil ID and commercial licence after approval.',
  },

  BH: {
    code: 'BH',
    nationalId: {
      label: 'CPR Number',
      placeholder: '123456789',
      hint: '9-digit Bahrain CPR (Central Population Registry)',
      example: '123456789',
      pattern: /^\d{9}$/,
      maxLength: 9,
      format: (v) => digitsOnly(v).slice(0, 9),
    },
    businessLicense: {
      label: 'CR Number',
      placeholder: '12345-1',
      hint: 'Sijilat commercial registration number',
      example: '12345-1',
      pattern: /^\d{4,6}-?\d{1,2}$/,
      maxLength: 10,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+973 3312 3456',
      hint: 'Bahrain mobile — +973 followed by 8 digits',
      example: '+973 3312 3456',
      pattern: /^\+973\s?\d{4}\s?\d{4}$/,
      maxLength: 16,
      format: (v) => formatDialPhone(v, '+973', 8),
    },
    address: {
      label: 'Business Address',
      placeholder: 'Manama, Bahrain',
      hint: 'Building, road, and city',
      example: 'Manama, Bahrain',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload CPR and CR documents after approval.',
  },

  OM: {
    code: 'OM',
    nationalId: {
      label: 'Civil ID',
      placeholder: '12345678',
      hint: '8-digit Oman Civil ID number',
      example: '12345678',
      pattern: /^\d{8}$/,
      maxLength: 8,
      format: (v) => digitsOnly(v).slice(0, 8),
    },
    businessLicense: {
      label: 'Commercial Registration',
      placeholder: 'CR-1234567',
      hint: 'Ministry of Commerce CR number',
      example: 'CR-1234567',
      pattern: /^CR-?\d{6,8}$/i,
      maxLength: 12,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+968 9123 4567',
      hint: 'Oman mobile — +968 followed by 8 digits',
      example: '+968 9123 4567',
      pattern: /^\+968\s?\d{4}\s?\d{4}$/,
      maxLength: 16,
      format: (v) => formatDialPhone(v, '+968', 8),
    },
    address: {
      label: 'Business Address',
      placeholder: 'Ruwi, Muscat',
      hint: 'Area, wilayat, and governorate',
      example: 'Ruwi, Muscat',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload Civil ID and CR after approval.',
  },

  BD: {
    code: 'BD',
    nationalId: {
      label: 'NID / Passport',
      placeholder: '1234567890123',
      hint: '13-digit National ID or passport number',
      example: '1234567890123',
      pattern: /^(\d{10}|\d{13}|[A-Z]{2}\d{7})$/i,
      maxLength: 13,
      format: (v) => digitsOnly(v).slice(0, 13) || v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9),
    },
    businessLicense: {
      label: 'Trade Licence',
      placeholder: 'TL-2024-12345',
      hint: 'City corporation trade licence number',
      example: 'TL-2024-12345',
      pattern: /^[A-Za-z]{2}-\d{4}-\d{4,6}$/,
      maxLength: 16,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+880 1712 345678',
      hint: 'Bangladesh mobile — +880 1XXX XXXXXX',
      example: '+880 1712 345678',
      pattern: /^\+880\s?1\d{3}\s?\d{6}$/,
      maxLength: 18,
      format: (v) => formatDialPhone(v, '+880', 10),
    },
    address: {
      label: 'Business Address',
      placeholder: 'Gulshan, Dhaka 1212',
      hint: 'Street, area, city, and postal code',
      example: 'Gulshan, Dhaka 1212',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload NID and trade licence after approval.',
  },

  EG: {
    code: 'EG',
    nationalId: {
      label: 'National ID',
      placeholder: '29012345678901',
      hint: '14-digit Egyptian National ID',
      example: '29012345678901',
      pattern: /^\d{14}$/,
      maxLength: 14,
      format: (v) => digitsOnly(v).slice(0, 14),
    },
    businessLicense: {
      label: 'Commercial Register',
      placeholder: '123456',
      hint: 'GADA commercial registration number',
      example: '123456',
      pattern: /^\d{5,8}$/,
      maxLength: 8,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+20 100 123 4567',
      hint: 'Egypt mobile — +20 1XX XXX XXXX',
      example: '+20 100 123 4567',
      pattern: /^\+20\s?1\d{2}\s?\d{3}\s?\d{4}$/,
      maxLength: 18,
      format: (v) => formatDialPhone(v, '+20', 10),
    },
    address: {
      label: 'Business Address',
      placeholder: 'Nasr City, Cairo',
      hint: 'Street, district, and governorate',
      example: 'Nasr City, Cairo',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload National ID and commercial register after approval.',
  },

  TR: {
    code: 'TR',
    nationalId: {
      label: 'T.C. Kimlik No',
      placeholder: '12345678901',
      hint: '11-digit Turkish identity number',
      example: '12345678901',
      pattern: /^\d{11}$/,
      maxLength: 11,
      format: (v) => digitsOnly(v).slice(0, 11),
    },
    businessLicense: {
      label: 'Vergi No / Ticaret Sicil',
      placeholder: '1234567890',
      hint: 'Tax number or trade registry number',
      example: '1234567890',
      pattern: /^\d{10,12}$/,
      maxLength: 12,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+90 532 123 4567',
      hint: 'Turkey mobile — +90 5XX XXX XXXX',
      example: '+90 532 123 4567',
      pattern: /^\+90\s?5\d{2}\s?\d{3}\s?\d{4}$/,
      maxLength: 18,
      format: (v) => formatDialPhone(v, '+90', 10),
    },
    address: {
      label: 'Business Address',
      placeholder: 'Kadıköy, Istanbul 34710',
      hint: 'Mahalle, ilçe, il and postal code',
      example: 'Kadıköy, Istanbul 34710',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload Kimlik and trade registry documents after approval.',
  },

  FR: {
    code: 'FR',
    nationalId: {
      label: 'SIREN / SIRET',
      placeholder: '12345678900012',
      hint: '14-digit SIRET business identifier',
      example: '12345678900012',
      pattern: /^\d{14}$/,
      maxLength: 14,
      format: (v) => digitsOnly(v).slice(0, 14),
    },
    businessLicense: {
      label: 'Licence de transport',
      placeholder: 'LT-75-123456',
      hint: 'Vehicle rental operator licence number',
      example: 'LT-75-123456',
      pattern: /^[A-Za-z]{2}-\d{2}-\d{5,6}$/,
      maxLength: 14,
    },
    phone: {
      label: 'Téléphone',
      placeholder: '+33 6 12 34 56 78',
      hint: 'French mobile — +33 6/7 XX XX XX XX',
      example: '+33 6 12 34 56 78',
      pattern: /^\+33\s?[67]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/,
      maxLength: 20,
      format: (v) => formatDialPhone(v, '+33', 9),
    },
    address: {
      label: 'Adresse commerciale',
      placeholder: '12 Rue de Rivoli, 75001 Paris',
      hint: 'Rue, code postal et ville',
      example: '12 Rue de Rivoli, 75001 Paris',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Téléchargez SIRET et licence après approbation.',
  },

  IT: {
    code: 'IT',
    nationalId: {
      label: 'Codice Fiscale / P.IVA',
      placeholder: '12345678901',
      hint: '11-digit Partita IVA or 16-char Codice Fiscale',
      example: '12345678901',
      pattern: /^(\d{11}|[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z])$/i,
      maxLength: 16,
      format: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16),
    },
    businessLicense: {
      label: 'Licenza Noleggio',
      placeholder: 'MI-VR-2024-001',
      hint: 'Provincial vehicle rental licence',
      example: 'MI-VR-2024-001',
      pattern: /^[A-Za-z]{2}-[A-Za-z]{2}-\d{4}-\d{3}$/,
      maxLength: 16,
    },
    phone: {
      label: 'Cellulare',
      placeholder: '+39 312 345 6789',
      hint: 'Italian mobile — +39 3XX XXX XXXX',
      example: '+39 312 345 6789',
      pattern: /^\+39\s?3\d{2}\s?\d{3}\s?\d{4}$/,
      maxLength: 18,
      format: (v) => formatDialPhone(v, '+39', 10),
    },
    address: {
      label: 'Indirizzo commerciale',
      placeholder: 'Via Roma 1, 20121 Milano',
      hint: 'Via, CAP e città',
      example: 'Via Roma 1, 20121 Milano',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Carica P.IVA e licenza dopo l\'approvazione.',
  },

  ES: {
    code: 'ES',
    nationalId: {
      label: 'NIF / CIF',
      placeholder: 'B12345678',
      hint: 'Spanish tax ID (NIF for individuals, CIF for companies)',
      example: 'B12345678',
      pattern: /^[A-Z]\d{7}[A-Z0-9]$/i,
      maxLength: 9,
      format: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9),
    },
    businessLicense: {
      label: 'Licencia VTC / Renting',
      placeholder: 'M-VR-2024-001',
      hint: 'Autonomous community rental licence',
      example: 'M-VR-2024-001',
      pattern: /^[A-Za-z]-[A-Za-z]{2}-\d{4}-\d{3}$/,
      maxLength: 16,
    },
    phone: {
      label: 'Teléfono móvil',
      placeholder: '+34 612 345 678',
      hint: 'Spanish mobile — +34 6XX XXX XXX',
      example: '+34 612 345 678',
      pattern: /^\+34\s?[67]\d{2}\s?\d{3}\s?\d{3}$/,
      maxLength: 16,
      format: (v) => formatDialPhone(v, '+34', 9),
    },
    address: {
      label: 'Dirección comercial',
      placeholder: 'Calle Mayor 1, 28001 Madrid',
      hint: 'Calle, código postal y ciudad',
      example: 'Calle Mayor 1, 28001 Madrid',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Suba NIF/CIF y licencia tras la aprobación.',
  },

  NL: {
    code: 'NL',
    nationalId: {
      label: 'KVK / BSN',
      placeholder: '12345678',
      hint: '8-digit KVK chamber of commerce number',
      example: '12345678',
      pattern: /^\d{8}$/,
      maxLength: 8,
      format: (v) => digitsOnly(v).slice(0, 8),
    },
    businessLicense: {
      label: 'Vergunning',
      placeholder: 'VR-2024-001',
      hint: 'Municipal vehicle rental permit',
      example: 'VR-2024-001',
      pattern: /^[A-Za-z]{2}-\d{4}-\d{3}$/,
      maxLength: 12,
    },
    phone: {
      label: 'Mobiel nummer',
      placeholder: '+31 6 12345678',
      hint: 'Dutch mobile — +31 6 XXXXXXXX',
      example: '+31 6 12345678',
      pattern: /^\+31\s?6\s?\d{8}$/,
      maxLength: 16,
      format: (v) => formatDialPhone(v, '+31', 9),
    },
    address: {
      label: 'Bedrijfsadres',
      placeholder: 'Damrak 1, 1012 LG Amsterdam',
      hint: 'Straat, postcode en plaats',
      example: 'Damrak 1, 1012 LG Amsterdam',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload KVK and vergunning after approval.',
  },

  MY: {
    code: 'MY',
    nationalId: {
      label: 'NRIC / SSM',
      placeholder: '123456-A',
      hint: 'NRIC for owner or SSM business registration',
      example: '123456-A',
      pattern: /^(\d{6}-\d{2}-\d{4}|\d{6}-[A-Z])$/i,
      maxLength: 14,
      format: (v) => v.toUpperCase(),
    },
    businessLicense: {
      label: 'JPJ Permit',
      placeholder: 'JPJ-2024-12345',
      hint: 'JPJ vehicle rental permit number',
      example: 'JPJ-2024-12345',
      pattern: /^JPJ-\d{4}-\d{4,6}$/i,
      maxLength: 16,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+60 12 345 6789',
      hint: 'Malaysia mobile — +60 1X XXX XXXX',
      example: '+60 12 345 6789',
      pattern: /^\+60\s?1\d\s?\d{3}\s?\d{4}$/,
      maxLength: 18,
      format: (v) => formatDialPhone(v, '+60', 10),
    },
    address: {
      label: 'Business Address',
      placeholder: 'Jalan Ampang, 50450 Kuala Lumpur',
      hint: 'Street, postcode, and state',
      example: 'Jalan Ampang, 50450 Kuala Lumpur',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload SSM and JPJ permit after approval.',
  },

  SG: {
    code: 'SG',
    nationalId: {
      label: 'NRIC / UEN',
      placeholder: 'S1234567A',
      hint: 'NRIC for owner or UEN business registration',
      example: 'S1234567A',
      pattern: /^([STFGM]\d{7}[A-Z]|\d{8}[A-Z]|[0-9]{9}[A-Z])$/i,
      maxLength: 10,
      format: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
    },
    businessLicense: {
      label: 'LTA Licence',
      placeholder: 'LTA-VR-12345',
      hint: 'LTA vehicle rental operator licence',
      example: 'LTA-VR-12345',
      pattern: /^LTA-[A-Za-z]{2}-\d{4,6}$/i,
      maxLength: 14,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+65 8123 4567',
      hint: 'Singapore mobile — +65 8XXX XXXX',
      example: '+65 8123 4567',
      pattern: /^\+65\s?[89]\d{3}\s?\d{4}$/,
      maxLength: 14,
      format: (v) => formatDialPhone(v, '+65', 8),
    },
    address: {
      label: 'Business Address',
      placeholder: '1 Raffles Place, Singapore 048616',
      hint: 'Block, street, and postal code',
      example: '1 Raffles Place, Singapore 048616',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload UEN and LTA licence after approval.',
  },

  JP: {
    code: 'JP',
    nationalId: {
      label: '法人番号 / マイナンバー',
      placeholder: '1234567890123',
      hint: '13-digit corporate number (Hōjin Bangō)',
      example: '1234567890123',
      pattern: /^\d{13}$/,
      maxLength: 13,
      format: (v) => digitsOnly(v).slice(0, 13),
    },
    businessLicense: {
      label: '貸自動車業許可',
      placeholder: '東京都-第12345号',
      hint: 'Prefectural vehicle rental business permit',
      example: '東京都-第12345号',
      pattern: /^.{6,20}$/,
      maxLength: 20,
    },
    phone: {
      label: '電話番号',
      placeholder: '+81 90 1234 5678',
      hint: 'Japan mobile — +81 90/80 XXXX XXXX',
      example: '+81 90 1234 5678',
      pattern: /^\+81\s?(70|80|90)\s?\d{4}\s?\d{4}$/,
      maxLength: 18,
      format: (v) => formatDialPhone(v, '+81', 10),
    },
    address: {
      label: '事業所住所',
      placeholder: '東京都渋谷区1-1-1',
      hint: '都道府県、市区町村、番地',
      example: '東京都渋谷区1-1-1',
      pattern: /^.{10,200}$/,
    },
    documentHint: '承認後に法人番号と許可証をアップロードしてください。',
  },

  ZA: {
    code: 'ZA',
    nationalId: {
      label: 'SA ID / Company Reg',
      placeholder: '1234567890123',
      hint: '13-digit SA ID or company registration number',
      example: '1234567890123',
      pattern: /^(\d{13}|\d{4}\/\d{6}\/\d{2})$/,
      maxLength: 15,
      format: (v) => v.replace(/[^\d/]/g, '').slice(0, 15),
    },
    businessLicense: {
      label: 'Operating Licence',
      placeholder: 'GP-VR-2024-001',
      hint: 'Provincial vehicle rental operating licence',
      example: 'GP-VR-2024-001',
      pattern: /^[A-Za-z]{2}-[A-Za-z]{2}-\d{4}-\d{3}$/,
      maxLength: 16,
    },
    phone: {
      label: 'Mobile Number',
      placeholder: '+27 82 123 4567',
      hint: 'South Africa mobile — +27 6X/7X/8X XXX XXXX',
      example: '+27 82 123 4567',
      pattern: /^\+27\s?[678]\d\s?\d{3}\s?\d{4}$/,
      maxLength: 18,
      format: (v) => formatDialPhone(v, '+27', 9),
    },
    address: {
      label: 'Business Address',
      placeholder: 'Sandton, Johannesburg 2196',
      hint: 'Street, suburb, city, and postal code',
      example: 'Sandton, Johannesburg 2196',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Upload ID and operating licence after approval.',
  },

  BR: {
    code: 'BR',
    nationalId: {
      label: 'CNPJ / CPF',
      placeholder: '12.345.678/0001-90',
      hint: 'CNPJ for company or CPF for sole proprietor',
      example: '12.345.678/0001-90',
      pattern: /^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})$/,
      maxLength: 18,
      format: (v) => {
        const d = digitsOnly(v).slice(0, 14)
        if (d.length <= 11) {
          if (d.length <= 3) return d
          if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
          if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
          return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
        }
        return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
      },
    },
    businessLicense: {
      label: 'Alvará / Licença',
      placeholder: 'ALV-2024-12345',
      hint: 'Municipal vehicle rental licence (Alvará)',
      example: 'ALV-2024-12345',
      pattern: /^[A-Za-z]{3}-\d{4}-\d{4,6}$/i,
      maxLength: 16,
    },
    phone: {
      label: 'Celular',
      placeholder: '+55 (11) 91234-5678',
      hint: 'Brazil mobile — +55 (XX) 9XXXX-XXXX',
      example: '+55 (11) 91234-5678',
      pattern: /^\+55\s?\(\d{2}\)\s?9\d{4}-\d{4}$/,
      maxLength: 20,
      format: formatBRPhone,
    },
    address: {
      label: 'Endereço comercial',
      placeholder: 'Av. Paulista 1000, São Paulo SP',
      hint: 'Rua, cidade, estado e CEP',
      example: 'Av. Paulista 1000, São Paulo SP',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Envie CNPJ e alvará após aprovação.',
  },

  MX: {
    code: 'MX',
    nationalId: {
      label: 'RFC',
      placeholder: 'XAXX010101000',
      hint: '13-character tax ID (RFC) for business',
      example: 'XAXX010101000',
      pattern: /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i,
      maxLength: 13,
      format: (v) => v.toUpperCase().replace(/[^A-Z0-9&Ñ]/g, '').slice(0, 13),
    },
    businessLicense: {
      label: 'Permiso de Arrendamiento',
      placeholder: 'PA-CDMX-2024-001',
      hint: 'State vehicle rental permit number',
      example: 'PA-CDMX-2024-001',
      pattern: /^[A-Za-z]{2}-[A-Za-z]{3,5}-\d{4}-\d{3}$/,
      maxLength: 20,
    },
    phone: {
      label: 'Teléfono móvil',
      placeholder: '+52 55 1234 5678',
      hint: 'Mexico mobile — +52 XX XXXX XXXX',
      example: '+52 55 1234 5678',
      pattern: /^\+52\s?\d{2}\s?\d{4}\s?\d{4}$/,
      maxLength: 18,
      format: formatMXPhone,
    },
    address: {
      label: 'Dirección comercial',
      placeholder: 'Av. Reforma 100, Ciudad de México',
      hint: 'Calle, colonia, ciudad y CP',
      example: 'Av. Reforma 100, Ciudad de México',
      pattern: /^.{10,200}$/,
    },
    documentHint: 'Suba RFC y permiso después de la aprobación.',
  },
}

export function getCountryFormConfig(countryCode: string): CountryRegistrationConfig {
  return COUNTRY_FORM_CONFIGS[countryCode.toUpperCase()] || DEFAULT
}

export function getCountryFormConfigById(
  countryId: string,
  countries: { id: string; code: string }[]
): CountryRegistrationConfig {
  const country = countries.find(c => c.id === countryId)
  return country ? getCountryFormConfig(country.code) : DEFAULT
}

export type ValidationResult = { valid: boolean; message?: string }

export function validateCountryField(
  countryCode: string,
  field: 'nationalId' | 'businessLicense' | 'phone' | 'address',
  value: string
): ValidationResult {
  const config = getCountryFormConfig(countryCode)
  const fieldConfig =
    field === 'nationalId' ? config.nationalId
    : field === 'businessLicense' ? config.businessLicense
    : field === 'phone' ? config.phone
    : config.address

  const trimmed = value.trim()
  if (!trimmed) return { valid: false, message: `${fieldConfig.label} is required` }

  if (field === 'phone') {
    const digitsCount = trimmed.replace(/\D/g, '').length
    const hasPlus = trimmed.startsWith('+')
    if (!hasPlus || digitsCount < 7 || digitsCount > 15) {
      return {
        valid: false,
        message: `Enter a valid phone number with country code. Example: ${fieldConfig.example}`,
      }
    }
    return { valid: true }
  }

  if (!fieldConfig.pattern.test(trimmed)) {
    return {
      valid: false,
      message: `Invalid format. Example: ${fieldConfig.example}`,
    }
  }

  return { valid: true }
}

export function validateCompanyForm(
  countryCode: string,
  data: {
    cnicOrId: string
    licenseNumber: string
    contactNumber: string
    whatsAppNumber: string
    businessAddress: string
  },
  isHotel?: boolean
): ValidationResult {
  const checks: ValidationResult[] = [
    validateCountryField(countryCode, 'nationalId', data.cnicOrId),
    ...(!isHotel ? [validateCountryField(countryCode, 'businessLicense', data.licenseNumber)] : []),
    validateCountryField(countryCode, 'phone', data.contactNumber),
    validateCountryField(countryCode, 'phone', data.whatsAppNumber),
    validateCountryField(countryCode, 'address', data.businessAddress),
  ]
  const failed = checks.find(c => !c.valid)
  return failed || { valid: true }
}

export function applyFieldFormat(
  countryCode: string,
  field: 'nationalId' | 'phone',
  value: string
): string {
  const config = getCountryFormConfig(countryCode)
  const fieldConfig = field === 'nationalId' ? config.nationalId : config.phone
  return fieldConfig.format ? fieldConfig.format(value) : value
}
