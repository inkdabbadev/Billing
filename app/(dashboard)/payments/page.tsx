'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { PaymentMethod } from '@/lib/types/database'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  payment_details: z.string().min(1, 'Payment details are required'),
  is_default: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>

export default function PaymentsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [saving, setSaving] = useState(false)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) as Resolver<FormValues> })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/payment-methods')
      const data = await r.json()
      setMethods(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null)
    reset({ title: '', payment_details: '', is_default: false })
    setError('')
    setModalOpen(true)
  }

  function openEdit(m: PaymentMethod) {
    setEditing(m)
    reset({ title: m.title, payment_details: m.payment_details, is_default: m.is_default })
    setError('')
    setModalOpen(true)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setError('')
    try {
      const url = editing ? `/api/payment-methods/${editing.id}` : '/api/payment-methods'
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!r.ok) {
        const e = await r.json()
        throw new Error(e.error ?? 'Failed to save')
      }
      setModalOpen(false)
      load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function setDefault(id: string) {
    setSettingDefault(id)
    try {
      await fetch(`/api/payment-methods/${id}`, { method: 'PATCH' })
      load()
    } finally {
      setSettingDefault(null)
    }
  }

  async function deleteMethod(id: string) {
    if (!confirm('Delete this payment method? This cannot be undone.')) return
    setDeleting(id)
    try {
      await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
      load()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage reusable payment details for invoices
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Add Payment Method
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-sm text-gray-400">No payment methods saved yet.</p>
          <button
            onClick={openAdd}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Add your first payment method →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div
              key={m.id}
              className={`bg-white border rounded-xl px-6 py-5 flex items-start justify-between gap-4 ${
                m.is_default ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                  {m.is_default && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 whitespace-pre-line break-words">
                  {m.payment_details}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                {!m.is_default && (
                  <button
                    onClick={() => setDefault(m.id)}
                    disabled={settingDefault === m.id}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap"
                  >
                    {settingDefault === m.id ? '…' : 'Set Default'}
                  </button>
                )}
                <button
                  onClick={() => openEdit(m)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMethod(m.id)}
                  disabled={deleting === m.id}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {deleting === m.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {editing ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <Field label="Title *" error={errors.title?.message}>
                <input
                  {...register('title')}
                  className={inp(!!errors.title)}
                  placeholder="e.g. Axis Bank – Bhuvaneshwaran"
                />
              </Field>

              <Field label="Payment Details *" error={errors.payment_details?.message}>
                <textarea
                  {...register('payment_details')}
                  rows={3}
                  className={inp(!!errors.payment_details)}
                  placeholder="All payments can be made to Bhuvaneshwaran | AXIS A/c no- 920010002148814 | IFSC-UTIB0004583"
                />
              </Field>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('is_default')} className="rounded" />
                <span className="text-gray-700">Set as default payment method</span>
              </label>
              <p className="text-xs text-gray-400 -mt-2">
                The default method is auto-selected when creating a new invoice.
              </p>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editing ? 'Update' : 'Add Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inp(hasError = false) {
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
    hasError ? 'border-red-400' : 'border-gray-200'
  }`
}
