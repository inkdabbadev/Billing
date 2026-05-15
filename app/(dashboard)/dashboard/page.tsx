'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { fmt } from '@/lib/utils/calculateInvoice'
import type { Company, Item } from '@/lib/types/database'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'companies' | 'invoices' | 'items' | 'drafts'

interface InvoiceRow {
  id: string
  invoice_no: string
  invoice_date: string
  grand_total: number
  status: 'draft' | 'generated' | 'sent' | 'paid'
  bill_to_company_id: string | null
  bill_to_company: { id: string; company_name: string; branch: string | null } | null
}

interface InvoiceItemLink {
  invoice_id: string
  item_id: string
  total: number
}

interface DashboardData {
  invoices: InvoiceRow[]
  companies: Company[]
  items: Item[]
  invoiceItems: InvoiceItemLink[]
}

interface ComputedStats {
  totalCount: number
  totalLabel: string
  totalSub: string
  revenue: number
  pending: number
  draftCount: number
  paidCount: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  draft:  'bg-gray-100 text-gray-600',
  unpaid: 'bg-amber-100 text-amber-700',
  paid:   'bg-green-100 text-green-700',
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'companies', label: 'Companies' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'items', label: 'Items' },
  { id: 'drafts', label: 'Drafts' },
]

const isDraft  = (s: string) => s === 'draft'
const isUnpaid = (s: string) => s === 'unpaid'
const isPaid   = (s: string) => s === 'paid'

// ── Stat computation ──────────────────────────────────────────────────────────

function computeStats(
  tab: Tab,
  selCompanies: Set<string>,
  selInvoices: Set<string>,
  selItems: Set<string>,
  selDrafts: Set<string>,
  data: DashboardData,
): ComputedStats {
  const { invoices, items, invoiceItems } = data
  const allDrafts = invoices.filter((i) => isDraft(i.status))

  let working: InvoiceRow[]
  let totalCount: number
  let totalLabel: string
  let totalSub: string

  if (tab === 'companies') {
    if (selCompanies.size > 0) {
      working = invoices.filter(
        (i) => i.bill_to_company_id && selCompanies.has(i.bill_to_company_id)
      )
      totalCount = selCompanies.size
      totalLabel = selCompanies.size === 1 ? 'Company' : 'Companies'
      totalSub = `${working.length} invoice${working.length !== 1 ? 's' : ''}`
    } else {
      working = invoices
      totalCount = invoices.length
      totalLabel = 'Total Invoices'
      totalSub = 'All time'
    }
  } else if (tab === 'invoices') {
    if (selInvoices.size > 0) {
      working = invoices.filter((i) => selInvoices.has(i.id))
      totalCount = working.length
      totalLabel = 'Selected'
      totalSub = 'invoices'
    } else {
      working = invoices
      totalCount = invoices.length
      totalLabel = 'Total Invoices'
      totalSub = 'All time'
    }
  } else if (tab === 'items') {
    if (selItems.size > 0) {
      const selectedLinks = invoiceItems.filter((ii) => selItems.has(ii.item_id))
      const linkedInvoiceIds = new Set(selectedLinks.map((ii) => ii.invoice_id))
      working = invoices.filter((i) => linkedInvoiceIds.has(i.id))
      totalCount = selItems.size
      totalLabel = selItems.size === 1 ? 'Item' : 'Items'
      totalSub = `${working.length} invoice${working.length !== 1 ? 's' : ''}`

      const invoiceStatusMap = new Map(invoices.map((i) => [i.id, i.status]))
      const itemRevenue = selectedLinks
        .filter((ii) => isPaid(invoiceStatusMap.get(ii.invoice_id) ?? ''))
        .reduce((s, ii) => s + Number(ii.total), 0)
      const itemPending = selectedLinks
        .filter((ii) => isUnpaid(invoiceStatusMap.get(ii.invoice_id) ?? ''))
        .reduce((s, ii) => s + Number(ii.total), 0)
      const draftCount = new Set(selectedLinks.filter((ii) => isDraft(invoiceStatusMap.get(ii.invoice_id) ?? '')).map((ii) => ii.invoice_id)).size
      const paidCount  = new Set(selectedLinks.filter((ii) => isPaid(invoiceStatusMap.get(ii.invoice_id) ?? '')).map((ii) => ii.invoice_id)).size

      return { totalCount, totalLabel, totalSub, revenue: itemRevenue, pending: itemPending, draftCount, paidCount }
    } else {
      working = invoices
      totalCount = items.length
      totalLabel = 'Total Items'
      totalSub = 'In catalog'
    }
  } else {
    // drafts tab
    if (selDrafts.size > 0) {
      working = allDrafts.filter((i) => selDrafts.has(i.id))
      totalCount = working.length
      totalLabel = 'Selected'
      totalSub = 'drafts'
    } else {
      working = allDrafts
      totalCount = allDrafts.length
      totalLabel = 'Total Drafts'
      totalSub = 'Pending generation'
    }
  }

  const revenue    = working.filter((i) => isPaid(i.status)).reduce((s, i) => s + Number(i.grand_total), 0)
  const pending    = working.filter((i) => isUnpaid(i.status)).reduce((s, i) => s + Number(i.grand_total), 0)
  const draftCount = working.filter((i) => isDraft(i.status)).length
  const paidCount  = working.filter((i) => isPaid(i.status)).length

  return { totalCount, totalLabel, totalSub, revenue, pending, draftCount, paidCount }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tab, setTab]                   = useState<Tab>('companies')
  const [selCompanies, setSelCompanies] = useState<Set<string>>(new Set())
  const [selInvoices, setSelInvoices]   = useState<Set<string>>(new Set())
  const [selItems, setSelItems]         = useState<Set<string>>(new Set())
  const [selDrafts, setSelDrafts]       = useState<Set<string>>(new Set())
  const [data, setData]                 = useState<DashboardData | null>(null)
  const [loading, setLoading]           = useState(true)
  const [fetchError, setFetchError]     = useState('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load dashboard data')
        return r.json()
      })
      .then(setData)
      .catch((e: Error) => {
        console.error('[Dashboard]', e)
        setFetchError(e.message)
      })
      .finally(() => setLoading(false))
  }, [])

  // Per-company: invoice count and pending amount
  const companyStats = useMemo(() => {
    const map = new Map<string, { invoiceCount: number; pending: number }>()
    if (!data) return map
    for (const inv of data.invoices) {
      if (!inv.bill_to_company_id) continue
      const s = map.get(inv.bill_to_company_id) ?? { invoiceCount: 0, pending: 0 }
      s.invoiceCount++
      if (isUnpaid(inv.status)) s.pending += Number(inv.grand_total)
      map.set(inv.bill_to_company_id, s)
    }
    return map
  }, [data])

  // Per-item: how many distinct invoices use it
  const itemUsage = useMemo(() => {
    const map = new Map<string, number>()
    if (!data) return map
    for (const ii of data.invoiceItems) {
      map.set(ii.item_id, (map.get(ii.item_id) ?? 0) + 1)
    }
    return map
  }, [data])

  const stats = useMemo<ComputedStats | null>(() => {
    if (!data) return null
    return computeStats(tab, selCompanies, selInvoices, selItems, selDrafts, data)
  }, [tab, selCompanies, selInvoices, selItems, selDrafts, data])

  const draftInvoices = useMemo(
    () => data?.invoices.filter((i) => isDraft(i.status)) ?? [],
    [data]
  )

  const activeSel: Set<string> =
    tab === 'companies' ? selCompanies :
    tab === 'invoices'  ? selInvoices  :
    tab === 'items'     ? selItems     :
    selDrafts

  function clearSelection() {
    if (tab === 'companies') setSelCompanies(new Set())
    else if (tab === 'invoices') setSelInvoices(new Set())
    else if (tab === 'items') setSelItems(new Set())
    else setSelDrafts(new Set())
  }

  function toggle(id: string) {
    const setter =
      tab === 'companies' ? setSelCompanies :
      tab === 'invoices'  ? setSelInvoices  :
      tab === 'items'     ? setSelItems     :
      setSelDrafts
    setter((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selNoun = (() => {
    const n = activeSel.size
    if (n === 0) return null
    const noun =
      tab === 'companies' ? (n === 1 ? 'company' : 'companies') :
      tab === 'invoices'  ? (n === 1 ? 'invoice' : 'invoices')  :
      tab === 'items'     ? (n === 1 ? 'item'    : 'items')     :
      (n === 1 ? 'draft' : 'drafts')
    return `${n} ${noun} selected`
  })()

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Interactive overview — click any card to filter stats
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="t-btn-primary px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shrink-0"
        >
          + New Invoice
        </Link>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : fetchError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-sm text-red-600 font-medium">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs text-red-400 hover:text-red-600 underline"
          >
            Retry
          </button>
        </div>
      ) : data && stats ? (
        <>
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <StatCard label={stats.totalLabel} value={stats.totalCount} sub={stats.totalSub} />
            <StatCard
              label="Revenue Collected"
              value={`₹ ${fmt(stats.revenue)}`}
              sub="From paid invoices"
              highlight
            />
            <StatCard
              label="Overall Pending"
              value={`₹ ${fmt(stats.pending)}`}
              sub="Unpaid invoices"
              warning
            />
            <StatCard label="Drafts" value={stats.draftCount} sub="Draft / Generated" />
            <StatCard label="Paid" value={stats.paidCount} sub="Completed invoices" />
          </div>

          {/* ── Filter Tabs ── */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none">
            {TABS.map((t) => {
              const tabSel =
                t.id === 'companies' ? selCompanies :
                t.id === 'invoices'  ? selInvoices  :
                t.id === 'items'     ? selItems     :
                selDrafts
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 't-tab-active'
                      : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  style={isActive ? { backgroundColor: 'var(--t-primary)', color: '#fff' } : {}}
                >
                  {t.label}
                  {tabSel.size > 0 && (
                    <span
                      className="min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-bold leading-4.5 text-center inline-block"
                      style={isActive
                        ? { backgroundColor: '#fff', color: 'var(--t-primary)' }
                        : { backgroundColor: 'var(--t-primary)', color: '#fff' }
                      }
                    >
                      {tabSel.size}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Selection banner ── */}
          <div className="flex items-center justify-between mb-4 h-6">
            {selNoun ? (
              <>
                <p className="text-sm font-medium text-gray-700">{selNoun}</p>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Clear ×
                </button>
              </>
            ) : (
              <p className="text-xs text-gray-400">
                Showing all data — select cards to filter
              </p>
            )}
          </div>

          {/* ── Tab Content ── */}
          {tab === 'companies' && (
            <CompanyGrid
              companies={data.companies}
              companyStats={companyStats}
              selected={selCompanies}
              onToggle={toggle}
            />
          )}
          {tab === 'invoices' && (
            <InvoiceList
              invoices={data.invoices}
              selected={selInvoices}
              onToggle={toggle}
            />
          )}
          {tab === 'items' && (
            <ItemGrid
              items={data.items}
              itemUsage={itemUsage}
              selected={selItems}
              onToggle={toggle}
            />
          )}
          {tab === 'drafts' && (
            <InvoiceList
              invoices={draftInvoices}
              selected={selDrafts}
              onToggle={toggle}
              emptyMsg="No draft or generated invoices."
            />
          )}
        </>
      ) : null}
    </div>
  )
}

// ── Company Grid ──────────────────────────────────────────────────────────────

function CompanyGrid({
  companies,
  companyStats,
  selected,
  onToggle,
}: {
  companies: Company[]
  companyStats: Map<string, { invoiceCount: number; pending: number }>
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = query.trim() === '' ? companies : companies.filter((c) => {
    const q = query.toLowerCase()
    return c.company_name.toLowerCase().includes(q) || c.branch?.toLowerCase().includes(q) || c.gstin?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)
  })

  if (!companies.length)
    return (
      <EmptyState
        msg="No companies found."
        action={<Link href="/companies" className="text-sm t-link">Add your first company →</Link>}
      />
    )

  return (
    <>
      <div className="mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companies…"
          className="t-input w-full sm:w-72 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-3 py-8 text-sm text-gray-400 text-center">No companies match your search.</div>
        ) : filtered.map((c) => {
          const s = companyStats.get(c.id)
          const isSel = selected.has(c.id)
          return (
            <button
              key={c.id}
              onClick={() => onToggle(c.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-150 w-full ${
                isSel ? 'shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            style={isSel ? {
              backgroundColor: 'var(--t-primary-soft)',
              borderColor: 'var(--t-primary)',
              boxShadow: '0 0 0 1px var(--t-primary)',
            } : {}}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-gray-900 truncate">{c.company_name}</p>
                  {c.branch && (
                    <p className="text-xs font-medium truncate mt-0.5" style={{ color: 'var(--t-primary)' }}>{c.branch}</p>
                  )}
                  {c.gstin && (
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{c.gstin}</p>
                  )}
                </div>
                {isSel && <Checkmark />}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-gray-500">
                  {s?.invoiceCount ?? 0} invoice{(s?.invoiceCount ?? 0) !== 1 ? 's' : ''}
                </span>
                {(s?.pending ?? 0) > 0 && (
                  <span className="text-amber-600 font-medium">₹ {fmt(s!.pending)} pending</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

// ── Item Grid ─────────────────────────────────────────────────────────────────

function ItemGrid({
  items,
  itemUsage,
  selected,
  onToggle,
}: {
  items: Item[]
  itemUsage: Map<string, number>
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = query.trim() === '' ? items : items.filter((it) => {
    const q = query.toLowerCase()
    return it.item_name.toLowerCase().includes(q) || it.description?.toLowerCase().includes(q) || it.hsn_sac?.toLowerCase().includes(q) || it.category?.toLowerCase().includes(q)
  })

  if (!items.length)
    return (
      <EmptyState
        msg="No items found."
        action={<Link href="/items" className="text-sm t-link">Add your first item →</Link>}
      />
    )

  return (
    <>
      <div className="mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items…"
          className="t-input w-full sm:w-72 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-3 py-8 text-sm text-gray-400 text-center">No items match your search.</div>
        ) : filtered.map((it) => {
          const used = itemUsage.get(it.id) ?? 0
          const isSel = selected.has(it.id)
          return (
            <button
              key={it.id}
              onClick={() => onToggle(it.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-150 w-full ${
                isSel ? 'shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
              style={isSel ? {
                backgroundColor: 'var(--t-primary-soft)',
                borderColor: 'var(--t-primary)',
                boxShadow: '0 0 0 1px var(--t-primary)',
              } : {}}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-gray-900 truncate">{it.item_name}</p>
                  {it.hsn_sac && (
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">HSN {it.hsn_sac}</p>
                  )}
                </div>
                {isSel && <Checkmark />}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-x-2 text-[11px]">
                <div>
                  <p className="text-gray-400">Rate</p>
                  <p className="font-semibold text-gray-700 mt-0.5">₹ {fmt(it.default_rate)}</p>
                </div>
                <div>
                  <p className="text-gray-400">GST</p>
                  <p className="font-semibold text-gray-700 mt-0.5">{it.gst_percent}%</p>
                </div>
                <div>
                  <p className="text-gray-400">Used in</p>
                  <p className="font-semibold text-gray-700 mt-0.5">{used} inv.</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

// ── Invoice List (shared by Invoices + Drafts tabs) ───────────────────────────

function InvoiceList({
  invoices,
  selected,
  onToggle,
  emptyMsg,
}: {
  invoices: InvoiceRow[]
  selected: Set<string>
  onToggle: (id: string) => void
  emptyMsg?: string
}) {
  if (!invoices.length)
    return (
      <EmptyState
        msg={emptyMsg ?? 'No invoices found.'}
        action={
          <Link href="/invoices/new" className="text-sm t-link">
            Create your first invoice →
          </Link>
        }
      />
    )

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-gray-50">
        {invoices.map((inv) => {
          const isSel = selected.has(inv.id)
          return (
            <div
              key={inv.id}
              onClick={() => onToggle(inv.id)}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                isSel ? 'border-l-2' : 'hover:bg-gray-50'
              }`}
              style={isSel ? { backgroundColor: 'var(--t-primary-soft)', borderLeftColor: 'var(--t-primary)' } : {}}
            >
              <RowCheck checked={isSel} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/invoices/${inv.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-sm text-gray-900 hover:underline truncate"
                  >
                    {inv.invoice_no}
                  </Link>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize shrink-0 ${
                      STATUS_COLOR[inv.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {inv.bill_to_company?.company_name ?? '—'}
                </p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-400">{inv.invoice_date}</p>
                  <p className="text-sm font-semibold text-gray-900">₹ {fmt(inv.grand_total)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <table className="hidden sm:table w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
            <th className="pl-5 pr-2 py-3 w-10"></th>
            <th className="px-3 py-3 text-left font-medium">Invoice #</th>
            <th className="px-3 py-3 text-left font-medium">Client</th>
            <th className="px-3 py-3 text-left font-medium">Date</th>
            <th className="px-3 py-3 text-right font-medium">Amount</th>
            <th className="px-3 py-3 pr-5 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const isSel = selected.has(inv.id)
            return (
              <tr
                key={inv.id}
                onClick={() => onToggle(inv.id)}
                className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                  isSel ? '' : 'hover:bg-gray-50'
                }`}
              style={isSel ? { backgroundColor: 'var(--t-primary-soft)' } : {}}
              >
                <td className="pl-5 pr-2 py-3">
                  <RowCheck checked={isSel} />
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/invoices/${inv.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {inv.invoice_no}
                  </Link>
                </td>
                <td className="px-3 py-3 text-gray-600 max-w-50 truncate">
                  {inv.bill_to_company?.company_name ?? '—'}
                </td>
                <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{inv.invoice_date}</td>
                <td className="px-3 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                  ₹ {fmt(inv.grand_total)}
                </td>
                <td className="px-3 py-3 pr-5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      STATUS_COLOR[inv.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Shared small components ───────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  highlight,
  warning,
}: {
  label: string
  value: string | number
  sub: string
  highlight?: boolean
  warning?: boolean
}) {
  if (highlight) {
    return (
      <div className="rounded-xl p-4 sm:p-5 border" style={{ backgroundColor: 'var(--t-primary)', borderColor: 'var(--t-primary)' }}>
        <p className="text-[11px] sm:text-xs font-medium mb-1.5 leading-tight" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</p>
        <p className="text-xl sm:text-2xl font-bold leading-none text-white">{value}</p>
        <p className="text-[10px] sm:text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{sub}</p>
      </div>
    )
  }
  const bg     = warning ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
  const lblClr = warning ? 'text-amber-600' : 'text-gray-500'
  const valClr = warning ? 'text-amber-700' : 'text-gray-900'
  const subClr = warning ? 'text-amber-500' : 'text-gray-400'
  return (
    <div className={`rounded-xl p-4 sm:p-5 border ${bg}`}>
      <p className={`text-[11px] sm:text-xs font-medium mb-1.5 leading-tight ${lblClr}`}>{label}</p>
      <p className={`text-xl sm:text-2xl font-bold leading-none ${valClr}`}>{value}</p>
      <p className={`text-[10px] sm:text-xs mt-1.5 ${subClr}`}>{sub}</p>
    </div>
  )
}

function Checkmark() {
  return (
    <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--t-primary)' }}>
      <svg className="w-3 h-3 text-white" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function RowCheck({ checked }: { checked: boolean }) {
  return (
    <div
      className="shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
      style={checked ? { borderColor: 'var(--t-primary)', backgroundColor: 'var(--t-primary)' } : { borderColor: '#D1D5DB' }}
    >
      {checked && (
        <svg className="w-2 h-2 text-white" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-100 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function EmptyState({ msg, action }: { msg: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <p className="text-sm text-gray-400">{msg}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
