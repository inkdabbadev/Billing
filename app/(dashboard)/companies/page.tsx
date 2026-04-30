'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Company } from '@/lib/types/database'

const schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .or(z.literal(''))
    .optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default('India'),
  is_client: z.boolean().default(true),
  is_supplier: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
]

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) as Resolver<FormValues> })

  const load = useCallback(async (q = '') => {
    setLoading(true)
    const r = await fetch(`/api/companies?search=${encodeURIComponent(q)}`)
    const data = await r.json()
    setCompanies(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search, load])

  function openAdd() {
    setEditing(null)
    reset({ company_name: '', gstin: '', email: '', phone: '', address_line_1: '', address_line_2: '', city: '', state: '', pincode: '', country: 'India', is_client: true, is_supplier: false })
    setError('')
    setModalOpen(true)
  }

  function openEdit(c: Company) {
    setEditing(c)
    reset({ ...c, gstin: c.gstin ?? '', email: c.email ?? '', phone: c.phone ?? '', address_line_1: c.address_line_1 ?? '', address_line_2: c.address_line_2 ?? '', city: c.city ?? '', state: c.state ?? '', pincode: c.pincode ?? '' })
    setError('')
    setModalOpen(true)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setError('')
    try {
      const url = editing ? `/api/companies/${editing.id}` : '/api/companies'
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

  async function deleteCompany(id: string) {
    if (!confirm('Delete this company? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load(search)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-1">Manage clients and suppliers</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Add Company
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search companies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading…</div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">No companies found.</p>
            <button onClick={openAdd} className="mt-2 text-sm text-blue-600">Add your first company →</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">Company</th>
                <th className="px-6 py-3 text-left font-medium">GSTIN</th>
                <th className="px-6 py-3 text-left font-medium">City</th>
                <th className="px-6 py-3 text-left font-medium">Phone</th>
                <th className="px-6 py-3 text-left font-medium">Type</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{c.company_name}</p>
                    {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                  </td>
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{c.gstin || '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{c.city || '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{c.phone || '—'}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      {c.is_client && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">Client</span>}
                      {c.is_supplier && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">Supplier</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-xs text-gray-600 hover:text-gray-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCompany(c.id)}
                      disabled={deleting === c.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleting === c.id ? '…' : 'Delete'}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Company' : 'Add Company'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <Field label="Company Name *" error={errors.company_name?.message}>
                <input {...register('company_name')} className={input(!!errors.company_name)} placeholder="Acme Pvt Ltd" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="GSTIN" error={errors.gstin?.message}>
                  <input {...register('gstin')} className={input(!!errors.gstin)} placeholder="27AABCU9603R1ZX" />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <input {...register('email')} className={input(!!errors.email)} placeholder="accounts@company.com" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone">
                  <input {...register('phone')} className={input()} placeholder="+91-9999999999" />
                </Field>
                <Field label="Country">
                  <input {...register('country')} className={input()} defaultValue="India" />
                </Field>
              </div>

              <Field label="Address Line 1">
                <input {...register('address_line_1')} className={input()} placeholder="Building / Street" />
              </Field>
              <Field label="Address Line 2">
                <input {...register('address_line_2')} className={input()} placeholder="Area / Landmark" />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="City">
                  <input {...register('city')} className={input()} placeholder="Mumbai" />
                </Field>
                <Field label="State">
                  <select {...register('state')} className={input()}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Pincode">
                  <input {...register('pincode')} className={input()} placeholder="400001" />
                </Field>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...register('is_client')} className="rounded" />
                  <span className="text-gray-700">Is Client</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...register('is_supplier')} className="rounded" />
                  <span className="text-gray-700">Is Supplier</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editing ? 'Update Company' : 'Add Company'}
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

function input(hasError = false) {
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
    hasError ? 'border-red-400' : 'border-gray-200'
  }`
}
