'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Company } from '@/lib/types/database'

interface CompanyComboboxProps {
  companies: Company[]
  selectedId?: string | null
  onSelect: (id: string | null) => void
  placeholder?: string
  nullable?: boolean
}

export function CompanyCombobox({
  companies,
  selectedId,
  onSelect,
  placeholder = 'Search company…',
  nullable = false,
}: CompanyComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = companies.find((c) => c.id === selectedId)

  const filtered = query.trim() === ''
    ? companies
    : companies.filter((c) => {
        const q = query.toLowerCase()
        return (
          c.company_name.toLowerCase().includes(q) ||
          c.branch?.toLowerCase().includes(q) ||
          c.gstin?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q)
        )
      })

  const positionDropdown = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownMaxH = 288

    const style: React.CSSProperties = {
      position: 'fixed',
      left: rect.left,
      width: Math.max(rect.width, 260),
      zIndex: 9999,
    }

    if (spaceBelow >= dropdownMaxH || spaceBelow >= rect.top) {
      style.top = rect.bottom + 4
    } else {
      style.bottom = window.innerHeight - rect.top + 4
    }

    setDropdownStyle(style)
  }, [])

  function openDropdown() {
    positionDropdown()
    setOpen(true)
  }

  function closeDropdown() {
    setOpen(false)
    setQuery('')
  }

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      closeDropdown()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', positionDropdown, true)
    window.addEventListener('resize', positionDropdown)
    return () => {
      window.removeEventListener('scroll', positionDropdown, true)
      window.removeEventListener('resize', positionDropdown)
    }
  }, [open, positionDropdown])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') closeDropdown()
  }

  function displayLabel() {
    if (!selected) return null
    return (
      <>
        <span className="font-medium text-gray-900 truncate">{selected.company_name}</span>
        {selected.branch && <span className="text-gray-400 ml-1 text-xs truncate">– {selected.branch}</span>}
      </>
    )
  }

  const dropdown = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      <div className="p-2 border-b border-gray-100">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, GSTIN, city…"
          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>
      <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
        {nullable && (
          <li
            className="px-3 py-2.5 cursor-pointer hover:bg-gray-50 text-xs text-gray-400 italic"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => { onSelect(null); closeDropdown() }}
          >
            — Same as Bill To (clear)
          </li>
        )}
        {filtered.length === 0 ? (
          <li className="px-3 py-5 text-xs text-gray-400 text-center">No companies found</li>
        ) : (
          filtered.map((c) => (
            <li
              key={c.id}
              className="px-3 py-2.5 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(c.id); closeDropdown() }}
            >
              <p className="text-xs font-semibold text-gray-900 leading-tight">
                {c.company_name}
                {c.branch && <span className="font-normal text-gray-500"> – {c.branch}</span>}
              </p>
              <div className="flex flex-wrap gap-x-3 mt-0.5">
                {c.gstin && <span className="text-[10px] text-gray-400 font-mono">{c.gstin}</span>}
                {c.city && <span className="text-[10px] text-gray-400">{c.city}{c.state ? `, ${c.state}` : ''}</span>}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-left flex items-center justify-between gap-1 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white hover:border-gray-300 transition-colors"
      >
        <span className={`flex items-baseline gap-1 truncate min-w-0 ${selected ? '' : 'text-gray-400'}`}>
          {selected ? displayLabel() : placeholder}
        </span>
        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && createPortal(dropdown, document.body)}
    </>
  )
}
