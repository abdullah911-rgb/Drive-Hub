// ─────────────────────────────────────────────────────────────────────────────
// COUNTRIES DATA — used in client components (no server-only imports here)
// ─────────────────────────────────────────────────────────────────────────────

export type CountryMeta = {
  id: string
  name: string
  code: string
  flagUrl: string
  currency: string
  dialCode: string
}

export const COUNTRIES: CountryMeta[] = [
  // South Asia
  { id: 'country-pk', name: 'Pakistan', code: 'PK', flagUrl: 'https://flagcdn.com/pk.svg', currency: 'PKR', dialCode: '+92' },
  { id: 'country-in', name: 'India', code: 'IN', flagUrl: 'https://flagcdn.com/in.svg', currency: 'INR', dialCode: '+91' },
  { id: 'country-bd', name: 'Bangladesh', code: 'BD', flagUrl: 'https://flagcdn.com/bd.svg', currency: 'BDT', dialCode: '+880' },
  // Middle East & Gulf
  { id: 'country-sa', name: 'Saudi Arabia', code: 'SA', flagUrl: 'https://flagcdn.com/sa.svg', currency: 'SAR', dialCode: '+966' },
  { id: 'country-ae', name: 'United Arab Emirates', code: 'AE', flagUrl: 'https://flagcdn.com/ae.svg', currency: 'AED', dialCode: '+971' },
  { id: 'country-qa', name: 'Qatar', code: 'QA', flagUrl: 'https://flagcdn.com/qa.svg', currency: 'QAR', dialCode: '+974' },
  { id: 'country-kw', name: 'Kuwait', code: 'KW', flagUrl: 'https://flagcdn.com/kw.svg', currency: 'KWD', dialCode: '+965' },
  { id: 'country-bh', name: 'Bahrain', code: 'BH', flagUrl: 'https://flagcdn.com/bh.svg', currency: 'BHD', dialCode: '+973' },
  { id: 'country-om', name: 'Oman', code: 'OM', flagUrl: 'https://flagcdn.com/om.svg', currency: 'OMR', dialCode: '+968' },
  { id: 'country-eg', name: 'Egypt', code: 'EG', flagUrl: 'https://flagcdn.com/eg.svg', currency: 'EGP', dialCode: '+20' },
  { id: 'country-tr', name: 'Turkey', code: 'TR', flagUrl: 'https://flagcdn.com/tr.svg', currency: 'TRY', dialCode: '+90' },
  // Americas
  { id: 'country-us', name: 'United States', code: 'US', flagUrl: 'https://flagcdn.com/us.svg', currency: 'USD', dialCode: '+1' },
  { id: 'country-ca', name: 'Canada', code: 'CA', flagUrl: 'https://flagcdn.com/ca.svg', currency: 'CAD', dialCode: '+1' },
  { id: 'country-br', name: 'Brazil', code: 'BR', flagUrl: 'https://flagcdn.com/br.svg', currency: 'BRL', dialCode: '+55' },
  { id: 'country-mx', name: 'Mexico', code: 'MX', flagUrl: 'https://flagcdn.com/mx.svg', currency: 'MXN', dialCode: '+52' },
  // Europe
  { id: 'country-gb', name: 'United Kingdom', code: 'GB', flagUrl: 'https://flagcdn.com/gb.svg', currency: 'GBP', dialCode: '+44' },
  { id: 'country-de', name: 'Germany', code: 'DE', flagUrl: 'https://flagcdn.com/de.svg', currency: 'EUR', dialCode: '+49' },
  { id: 'country-fr', name: 'France', code: 'FR', flagUrl: 'https://flagcdn.com/fr.svg', currency: 'EUR', dialCode: '+33' },
  { id: 'country-it', name: 'Italy', code: 'IT', flagUrl: 'https://flagcdn.com/it.svg', currency: 'EUR', dialCode: '+39' },
  { id: 'country-es', name: 'Spain', code: 'ES', flagUrl: 'https://flagcdn.com/es.svg', currency: 'EUR', dialCode: '+34' },
  { id: 'country-nl', name: 'Netherlands', code: 'NL', flagUrl: 'https://flagcdn.com/nl.svg', currency: 'EUR', dialCode: '+31' },
  // Asia Pacific
  { id: 'country-au', name: 'Australia', code: 'AU', flagUrl: 'https://flagcdn.com/au.svg', currency: 'AUD', dialCode: '+61' },
  { id: 'country-my', name: 'Malaysia', code: 'MY', flagUrl: 'https://flagcdn.com/my.svg', currency: 'MYR', dialCode: '+60' },
  { id: 'country-sg', name: 'Singapore', code: 'SG', flagUrl: 'https://flagcdn.com/sg.svg', currency: 'SGD', dialCode: '+65' },
  { id: 'country-jp', name: 'Japan', code: 'JP', flagUrl: 'https://flagcdn.com/jp.svg', currency: 'JPY', dialCode: '+81' },
  // Africa
  { id: 'country-za', name: 'South Africa', code: 'ZA', flagUrl: 'https://flagcdn.com/za.svg', currency: 'ZAR', dialCode: '+27' },
]
