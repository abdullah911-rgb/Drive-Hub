import type { ValidationResult } from './countryFormConfig'

export type FieldVisualState = 'idle' | 'invalid' | 'valid'

export function getLiveFieldState(
  value: string,
  validation: ValidationResult,
  options: { touched?: boolean; required?: boolean } = {}
): FieldVisualState {
  const trimmed = value.trim()

  if (!trimmed) {
    if (options.touched && options.required !== false) return 'invalid'
    return 'idle'
  }

  return validation.valid ? 'valid' : 'invalid'
}

export function getInputStateClass(state: FieldVisualState): string {
  switch (state) {
    case 'valid':
      return 'input-valid'
    case 'invalid':
      return 'input-invalid'
    default:
      return ''
  }
}

export function validateRequiredText(value: string, label: string, minLength = 2): ValidationResult {
  const trimmed = value.trim()
  if (!trimmed) return { valid: false, message: `${label} is required` }
  if (trimmed.length < minLength) return { valid: false, message: `${label} must be at least ${minLength} characters` }
  return { valid: true }
}

export function validateEmail(value: string): ValidationResult {
  const trimmed = value.trim()
  if (!trimmed) return { valid: false, message: 'Email is required' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, message: 'Enter a valid email address' }
  }
  return { valid: true }
}
