'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fmt } from '@/lib/utils/calculateInvoice'

interface Stats {
  total: number
  draft: number
  generated: number
  paid: number
  revenue: number
  recent: Array<{
    id: string
    invoice_no: string
    invoice_date: string
    grand_total: number
    status: string
    bill_to_company: { company_name: string } | null
  }>
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  generated: 'bg-blue-100 text-blue-700',
  sent: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices')
      .then((r) => r.json())
      .then((invoices: any[]) => {
        if (!Array.isArray(invoices)) return
        const s: Stats = {
          total: invoices.length,
          draft: invoices.filter((i) => i.status === 'draft').length,
          generated: invoices.filter((i) => ['generated', 'sent'].includes(i.status)).length,
          paid: invoices.filter((i) => i.status === 'paid').length,
          revenue: invoices
            .filter((i) => i.status === 'paid')
            .reduce((s, i) => s + Number(i.grand_total), 0),
          recent: invoices.slice(0, 6),
        }
        setStats(s)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your invoicing activity</p>
        </div>
        <Link
          href="/invoices/new"
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          + New Invoice
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Invoices" value={stats?.total ?? 0} sub="All time" />
            <StatCard
              label="Revenue Collected"
              value={`₹ ${fmt(stats?.revenue ?? 0)}`}
              sub="From paid invoices"
              highlight
            />
            <StatCard label="Drafts" value={stats?.draft ?? 0} sub="Pending generation" />
            <StatCard label="Paid" value={stats?.paid ?? 0} sub="Completed invoices" />
          </div>

          {/* Recent invoices */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
              <Link href="/invoices" className="text-xs text-gray-500 hover:text-gray-900">
                View all →
              </Link>
            </div>
            {!stats?.recent.length ? (
              <EmptyState
                msg="No invoices yet"
                action={<Link href="/invoices/new" className="text-sm text-blue-600">Create your first invoice →</Link>}
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-6 py-3 text-left font-medium">Invoice #</th>
                    <th className="px-6 py-3 text-left font-medium">Client</th>
                    <th className="px-6 py-3 text-left font-medium">Date</th>
                    <th className="px-6 py-3 text-right font-medium">Amount</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((inv) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string | number
  sub: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl p-5 border ${highlight ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs font-medium mb-2 ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-xs mt-1 ${highlight ? 'text-gray-400' : 'text-gray-400'}`}>{sub}</p>
    </div>
  )
}

function EmptyState({ msg, action }: { msg: string; action?: React.ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-gray-400">{msg}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
