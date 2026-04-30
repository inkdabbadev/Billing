'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { fmt } from '@/lib/utils/calculateInvoice'

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  generated: 'bg-blue-100 text-blue-700',
  sent: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async (q = '', s = '') => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (s) params.set('status', s)
    const r = await fetch(`/api/invoices?${params}`)
    const data = await r.json()
    setInvoices(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(search, statusFilter), 300)
    return () => clearTimeout(t)
  }, [search, statusFilter, load])

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load(search, statusFilter)
  }

  async function downloadPdf(id: string, invoiceNo: string) {
    const r = await fetch(`/api/invoices/${id}/pdf`)
    if (!r.ok) { alert('PDF generation failed'); return }
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoiceNo}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    // Refresh to reflect status change (draft → generated)
    load(search, statusFilter)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/invoices/new"
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          + New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search invoice number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 min-w-[220px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="generated">Generated</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">No invoices found.</p>
            <Link href="/invoices/new" className="mt-2 inline-block text-sm text-blue-600">
              Create your first invoice →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">Invoice #</th>
                <th className="px-6 py-3 text-left font-medium">Client</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-right font-medium">Amount</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-gray-900 hover:underline">
                      {inv.invoice_no}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {inv.bill_to_company?.company_name ?? '—'}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{inv.invoice_date}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">
                    ₹ {fmt(inv.grand_total)}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right space-x-3">
                    <Link href={`/invoices/${inv.id}`} className="text-xs text-gray-600 hover:text-gray-900">
                      View
                    </Link>
                    <button
                      onClick={() => downloadPdf(inv.id, inv.invoice_no)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      PDF
                    </button>
                    <Link href={`/invoices/${inv.id}?edit=1`} className="text-xs text-gray-600 hover:text-gray-900">
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteInvoice(inv.id)}
                      disabled={deleting === inv.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleting === inv.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
