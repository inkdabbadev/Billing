'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Item } from '@/lib/types/database'
import { fmt } from '@/lib/utils/calculateInvoice'

const schema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  hsn_sac: z.string().optional(),
  unit: z.string().default('NOS'),
  default_rate: z.coerce.number().min(0, 'Rate cannot be negative'),
  gst_percent: z.coerce.number().min(0).max(100).default(18),
  category: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const GST_RATES = [0, 5, 12, 18, 28]
const UNITS = ['NOS', 'PCS', 'KGS', 'LTR', 'MTR', 'SQM', 'SQF', 'BOX', 'SET', 'HR', 'DAY', 'JOB']

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })

  const load = useCallback(async (q = '') => {
    setLoading(true)
    const r = await fetch(`/api/items?search=${encodeURIComponent(q)}`)
    const data = await r.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search, load])

  function openAdd() {
    setEditing(null)
    reset({ item_name: '', description: '', hsn_sac: '', unit: 'NOS', default_rate: 0, gst_percent: 18, category: '' })
    setError('')
    setModalOpen(true)
  }

  function openEdit(item: Item) {
    setEditing(item)
    reset({ ...item, description: item.description ?? '', hsn_sac: item.hsn_sac ?? '', category: item.category ?? '' })
    setError('')
    setModalOpen(true)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setError('')
    try {
      const url = editing ? `/api/items/${editing.id}` : '/api/items'
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
      load(search)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load(search)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items & Services</h1>
          <p className="text-sm text-gray-500 mt-1">Reusable catalog of goods and services</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
        >
          + Add Item
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">No items found.</p>
            <button onClick={openAdd} className="mt-2 text-sm text-blue-600">Add your first item →</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">Item / Service</th>
                <th className="px-6 py-3 text-left font-medium">HSN/SAC</th>
                <th className="px-6 py-3 text-left font-medium">Category</th>
                <th className="px-6 py-3 text-right font-medium">Rate</th>
                <th className="px-6 py-3 text-right font-medium">GST</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{item.item_name}</p>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                  </td>
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{item.hsn_sac || '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{item.category || '—'}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">
                    ₹ {fmt(item.default_rate)} / {item.unit}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {item.gst_percent}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => openEdit(item)} className="text-xs text-gray-600 hover:text-gray-900 mr-3">Edit</button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={deleting === item.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleting === item.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <Field label="Item / Service Name *" error={errors.item_name?.message}>
                <input {...register('item_name')} className={inp(!!errors.item_name)} placeholder="Screen Printing Service" />
              </Field>

              <Field label="Description">
                <textarea {...register('description')} className={inp()} rows={2} placeholder="Brief description" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="HSN / SAC Code">
                  <input {...register('hsn_sac')} className={inp()} placeholder="998912" />
                </Field>
                <Field label="Category">
                  <input {...register('category')} className={inp()} placeholder="Printing Services" />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Default Rate (₹) *" error={errors.default_rate?.message}>
                  <input type="number" step="0.01" {...register('default_rate')} className={inp(!!errors.default_rate)} placeholder="150.00" />
                </Field>
                <Field label="Unit">
                  <select {...register('unit')} className={inp()}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
                <Field label="GST %" error={errors.gst_percent?.message}>
                  <select {...register('gst_percent')} className={inp(!!errors.gst_percent)}>
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </Field>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editing ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
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
