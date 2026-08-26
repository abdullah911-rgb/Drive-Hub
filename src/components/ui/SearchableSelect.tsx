'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface SearchableOption {
  value: string
  label: string
  /** Optional leading content (flag emoji, icon, etc.) */
  prefix?: ReactNode
  /** Optional trailing badge / meta */
  suffix?: ReactNode
  /** Extra searchable text (e.g. country code) */
  keywords?: string
}

interface SearchableSelectProps {
  options: SearchableOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  buttonClassName?: string
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  emptyLabel?: string
  /** Allow clearing to empty value */
  allowClear?: boolean
  clearLabel?: string
  /** Compact trigger used in filter sidebars */
  size?: 'sm' | 'md'
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}

/** Rank options: starts-with first, then includes; preserve original order within rank */
export function rankOptions(options: SearchableOption[], query: string): SearchableOption[] {
  const q = normalize(query)
  if (!q) return options

  const starts: SearchableOption[] = []
  const includes: SearchableOption[] = []

  for (const opt of options) {
    const label = normalize(opt.label)
    const keywords = normalize(opt.keywords || '')
    const hay = `${label} ${keywords}`
    if (label.startsWith(q) || keywords.startsWith(q)) {
      starts.push(opt)
    } else if (hay.includes(q)) {
      includes.push(opt)
    }
  }

  return [...starts, ...includes]
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Type to filter…',
  className,
  buttonClassName,
  disabled = false,
  required = false,
  name,
  id,
  emptyLabel,
  allowClear = false,
  clearLabel = 'Clear',
  size = 'md',
}: SearchableSelectProps) {
  const autoId = useId()
  const listboxId = `${autoId}-listbox`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxH: number } | null>(null)

  useEffect(() => setMounted(true), [])

  const selected = useMemo(
    () => options.find(o => o.value === value) || null,
    [options, value]
  )

  const filtered = useMemo(() => rankOptions(options, query), [options, query])

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - 12
    const spaceAbove = rect.top - 12
    const preferBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove
    const maxH = Math.min(280, Math.max(140, preferBelow ? spaceBelow : spaceAbove))
    setPos({
      top: preferBelow ? rect.bottom + 6 : Math.max(8, rect.top - maxH - 6),
      left: Math.min(rect.left, window.innerWidth - Math.max(rect.width, 200) - 8),
      width: Math.max(rect.width, 200),
      maxH,
    })
  }, [])

  const openMenu = useCallback(() => {
    if (disabled) return
    setQuery('')
    setHighlight(0)
    setOpen(true)
    requestAnimationFrame(() => {
      updatePosition()
      searchRef.current?.focus()
    })
  }, [disabled, updatePosition])

  const closeMenu = useCallback(() => {
    setOpen(false)
    setQuery('')
    setHighlight(0)
  }, [])

  useEffect(() => {
    if (!open) return
    const onScroll = () => updatePosition()
    const onResize = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      closeMenu()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [open, closeMenu])

  useEffect(() => {
    setHighlight(0)
  }, [query])

  const pick = (val: string) => {
    onChange(val)
    closeMenu()
    triggerRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openMenu()
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(h => Math.min(h + 1, filtered.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => Math.max(h - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[highlight]
      if (opt) pick(opt.value)
      else if (allowClear && !query) pick('')
    }
  }

  const pad = size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'

  const panel =
    open && mounted && pos
      ? createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxH,
              zIndex: 9999,
            }}
            className="flex flex-col rounded-xl border border-border bg-card shadow-xl overflow-hidden"
            onKeyDown={onKeyDown}
          >
            <div className="p-2 border-b border-border shrink-0">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-[var(--focus-ring)]"
                aria-autocomplete="list"
                aria-controls={listboxId}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 p-1">
              {allowClear && (
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onClick={() => pick('')}
                  className={cn(
                    'w-full text-left rounded-lg px-3 py-2 text-sm transition-colors',
                    !value
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-foreground-muted hover:bg-elevated'
                  )}
                >
                  {clearLabel || emptyLabel || placeholder}
                </button>
              )}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-sm text-foreground-muted text-center">No matches</p>
              )}
              {filtered.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(opt.value)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors',
                    opt.value === value
                      ? 'bg-primary/15 text-primary font-semibold'
                      : i === highlight
                        ? 'bg-elevated text-foreground'
                        : 'text-foreground hover:bg-elevated'
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {opt.prefix && <span className="shrink-0 text-base leading-none">{opt.prefix}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {opt.suffix && <span className="shrink-0">{opt.suffix}</span>}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div className={cn('relative w-full', className)} onKeyDown={onKeyDown}>
      {/* Hidden input for native form required validation */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          readOnly
        />
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        className={cn(
          'input-dark w-full flex items-center justify-between gap-2 text-left cursor-pointer',
          pad,
          disabled && 'opacity-50 cursor-not-allowed',
          buttonClassName
        )}
      >
        <span className={cn('flex items-center gap-2 min-w-0', !selected && 'text-foreground-muted')}>
          {selected?.prefix && <span className="shrink-0 text-base leading-none">{selected.prefix}</span>}
          <span className="truncate">{selected?.label || emptyLabel || placeholder}</span>
          {selected?.suffix}
        </span>
        <span
          className={cn(
            'text-foreground-muted text-[10px] shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        >
          ▼
        </span>
      </button>
      {panel}
    </div>
  )
}
