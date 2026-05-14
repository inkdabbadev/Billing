'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Item } from '@/lib/types/database'

interface ItemComboboxProps {
  items: Item[]
  selectedItemId?: string | null
  onSelect: (item: Item) => void
}

export function ItemCombobox({ items, selectedItemId, onSelect }: ItemComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedItem = items.find((it) => it.id === selectedItemId)

  const filtered = query.trim() === ''
    ? items
    : items.filter((item) => {
        const q = query.toLowerCase()
        return (
          item.item_name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.hsn_sac?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
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
      width: Math.max(rect.width, 288),
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
    // Focus search input after dropdown renders
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
          placeholder="Search by name, HSN, description…"
          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>
      <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <li className="px-3 py-5 text-xs text-gray-400 text-center">No items found</li>
        ) : (
          filtered.map((item) => (
            <li
              key={item.id}
              className="px-3 py-2.5 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(item)
                closeDropdown()
              }}
            >
              <p className="text-xs font-semibold text-gray-900 leading-tight">{item.item_name}</p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 leading-tight">{item.description}</p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {item.hsn_sac && (
                  <span className="text-[10px] text-gray-400">HSN: {item.hsn_sac}</span>
                )}
                <span className="text-[10px] text-gray-400">
                  ₹{item.default_rate.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-400">GST {item.gst_percent}%</span>
                {item.unit && item.unit !== 'NOS' && (
                  <span className="text-[10px] text-gray-400">{item.unit}</span>
                )}
                {item.category && (
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">
                    {item.category}
                  </span>
                )}
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
        <span className={`truncate ${selectedItem ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedItem ? selectedItem.item_name : 'Search item…'}
        </span>
        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && createPortal(dropdown, document.body)}
    </>
  )
}
