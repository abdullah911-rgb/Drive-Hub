'use client'
import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getFlagEmoji } from '@/lib/utils'
import ValidatedInput from '@/components/shared/ValidatedInput'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { validateRequiredText } from '@/lib/liveValidation'
import {
  getCountryFormConfigById,
  applyFieldFormat,
  validateCountryField,
} from '@/lib/countryFormConfig'

export interface CompanyFormValues {
  companyName: string
  ownerName: string
  cnicOrId: string
  contactNumber: string
  whatsAppNumber: string
  businessAddress: string
  countryId: string
  licenseNumber: string
}

interface CompanyFormFieldsProps {
  form: CompanyFormValues
  onChange: (updates: Partial<CompanyFormValues>) => void
  onCountryChange?: (countryId: string, countryCode: string) => void
  countries: { id: string; name: string; code: string }[]
  countryPosition?: 'top' | 'bottom'
  showCountryBanner?: boolean
  showDocumentHint?: boolean
  companyType?: 'CAR_RENTAL' | 'HOTEL'
}

const labelClass = 'text-xs font-medium text-slate-400 mb-1 block'

export default function CompanyFormFields({
  form,
  onChange,
  onCountryChange,
  countries,
  countryPosition = 'bottom',
  showCountryBanner = true,
  showDocumentHint = true,
  companyType = 'CAR_RENTAL',
}: CompanyFormFieldsProps) {
  const prevCountryId = useRef(form.countryId)
  const config = getCountryFormConfigById(form.countryId, countries)
  const selectedCountry = countries.find(c => c.id === form.countryId)
  const countryCode = selectedCountry?.code || 'PK'

  useEffect(() => {
    if (prevCountryId.current && prevCountryId.current !== form.countryId) {
      onChange({
        cnicOrId: '',
        licenseNumber: '',
        contactNumber: '',
        whatsAppNumber: '',
      })
    }
    prevCountryId.current = form.countryId
  }, [form.countryId, onChange])

  const handleCountrySelect = (countryId: string) => {
    const matched = countries.find(c => c.id === countryId)
    onChange({ countryId })
    if (matched) onCountryChange?.(countryId, matched.code)
  }

  const validateNationalId = useCallback(
    (v: string) => validateCountryField(countryCode, 'nationalId', v),
    [countryCode]
  )
  const validateLicense = useCallback(
    (v: string) => validateCountryField(countryCode, 'businessLicense', v),
    [countryCode]
  )
  const validatePhone = useCallback(
    (v: string) => validateCountryField(countryCode, 'phone', v),
    [countryCode]
  )
  const validateAddress = useCallback(
    (v: string) => validateCountryField(countryCode, 'address', v),
    [countryCode]
  )

  const countrySelect = (
    <div>
      <label className={labelClass}>Country *</label>
      <SearchableSelect
        value={form.countryId}
        onChange={handleCountrySelect}
        required
        placeholder="Select Country"
        searchPlaceholder="Type a letter… e.g. P for Pakistan"
        options={countries.map(c => ({
          value: c.id,
          label: c.name,
          prefix: getFlagEmoji(c.code),
          keywords: c.code,
        }))}
      />
    </div>
  )

  return (
    <div className="space-y-3">
      {countryPosition === 'top' && countrySelect}

      {showCountryBanner && selectedCountry && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCountry.code}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-primary/20 bg-primary/5"
          >
            <span className="text-lg">{getFlagEmoji(selectedCountry.code)}</span>
            <div>
              <p className="text-xs font-bold text-white">{selectedCountry.name} registration format</p>
              <p className="text-[10px] text-slate-400">Fields below follow {selectedCountry.name} standards</p>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ValidatedInput
          label="Company Name"
          value={form.companyName}
          onChange={v => onChange({ companyName: v })}
          validate={v => validateRequiredText(v, 'Company name', 2)}
          placeholder="Your company name"
        />
        <ValidatedInput
          label="Owner Full Name"
          value={form.ownerName}
          onChange={v => onChange({ ownerName: v })}
          validate={v => validateRequiredText(v, 'Owner name', 2)}
          placeholder="Legal owner name"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`id-license-${countryCode}-${companyType}`}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.3 }}
          className={companyType === 'HOTEL' ? 'grid grid-cols-1' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}
        >
          <ValidatedInput
            key={`${countryCode}-nationalId`}
            label={config.nationalId.label}
            value={form.cnicOrId}
            onChange={v => onChange({ cnicOrId: applyFieldFormat(countryCode, 'nationalId', v) })}
            validate={validateNationalId}
            hint={config.nationalId.hint}
            example={config.nationalId.example}
            placeholder={config.nationalId.placeholder}
            maxLength={config.nationalId.maxLength}
          />
          {companyType !== 'HOTEL' && (
            <ValidatedInput
              key={`${countryCode}-license`}
              label={config.businessLicense.label}
              value={form.licenseNumber}
              onChange={v => onChange({ licenseNumber: v.toUpperCase() })}
              validate={validateLicense}
              hint={config.businessLicense.hint}
              example={config.businessLicense.example}
              placeholder={config.businessLicense.placeholder}
              maxLength={config.businessLicense.maxLength}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`phones-${countryCode}`}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <ValidatedInput
            key={`${countryCode}-contact`}
            label="Contact Number"
            value={form.contactNumber}
            onChange={v => onChange({ contactNumber: applyFieldFormat(countryCode, 'phone', v) })}
            validate={validatePhone}
            hint={config.phone.hint}
            example={config.phone.example}
            placeholder={config.phone.placeholder}
            maxLength={config.phone.maxLength}
          />
          <ValidatedInput
            key={`${countryCode}-whatsapp`}
            label="WhatsApp Number"
            value={form.whatsAppNumber}
            onChange={v => onChange({ whatsAppNumber: applyFieldFormat(countryCode, 'phone', v) })}
            validate={validatePhone}
            placeholder={config.phone.placeholder}
            maxLength={config.phone.maxLength}
          />
        </motion.div>
      </AnimatePresence>

      <ValidatedInput
        key={`${countryCode}-address`}
        label={config.address.label}
        value={form.businessAddress}
        onChange={v => onChange({ businessAddress: v })}
        validate={validateAddress}
        hint={config.address.hint}
        example={config.address.example}
        placeholder={config.address.placeholder}
      />

      {countryPosition === 'bottom' && countrySelect}

      {showDocumentHint && (
        <div className="glass rounded-xl p-3 text-xs text-amber-400 border border-amber-400/20">
          📄 {config.documentHint}
        </div>
      )}
    </div>
  )
}
