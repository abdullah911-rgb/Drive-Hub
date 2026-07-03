'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getLiveFieldState, getInputStateClass, type FieldVisualState } from '@/lib/liveValidation'
import type { ValidationResult } from '@/lib/countryFormConfig'

interface ValidatedInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  validate: (value: string) => ValidationResult
  hint?: string
  example?: string
  required?: boolean
  className?: string
  inputClassName?: string
  type?: string
  placeholder?: string
  maxLength?: number
  disabled?: boolean
}

const labelClass = 'text-xs font-medium text-slate-400 mb-1 block'

export default function ValidatedInput({
  label,
  value,
  onChange,
  validate,
  hint,
  example,
  required = true,
  className,
  inputClassName,
  type = 'text',
  placeholder,
  maxLength,
  disabled,
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false)
  const [focused, setFocused] = useState(false)

  const validation = useMemo(() => validate(value), [value, validate])
  const visualState: FieldVisualState = getLiveFieldState(value, validation, { touched, required })
  const showFeedback = visualState !== 'idle' || (touched && !value.trim())

  return (
    <div className={className}>
      <label className={labelClass}>
        {label}{required ? ' *' : ''}
      </label>
      <input
        type={type}
        className={cn(
          'input-dark text-sm transition-all duration-200',
          getInputStateClass(visualState),
          focused && visualState === 'idle' && 'input-focused',
          inputClassName
        )}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          setTouched(true)
        }}
        aria-invalid={visualState === 'invalid'}
        aria-describedby={showFeedback && !validation.valid ? `${label}-error` : undefined}
      />

      {hint && visualState === 'idle' && !touched && (
        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
          {hint}
          {example && <span className="text-primary/70 ml-1">e.g. {example}</span>}
        </p>
      )}

      <AnimatePresence mode="wait">
        {showFeedback && (
          <motion.p
            key={validation.valid ? 'ok' : validation.message}
            id={!validation.valid ? `${label}-error` : undefined}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'text-[10px] mt-1 leading-relaxed font-medium',
              validation.valid ? 'text-emerald-500' : 'text-red-400'
            )}
          >
            {validation.valid ? '✓ Looks good' : validation.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
