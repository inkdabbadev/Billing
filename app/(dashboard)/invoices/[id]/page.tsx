'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm, useFieldArray, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { fmt, calculateLine, calculateTotals } from '@/lib/utils/calculateInvoice'
import type { Company, Item } from '@/lib/types/database'
import type { InvoiceLineInput, InvoiceWithRelations } from '@/lib/types/invoice'

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  generated: 'bg-blue-100 text-blue-700',
  sent: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
}

// ── Edit form schema ──────────────────────────────────────────────────────────

const lineSchema = z.object({
  item_id: z.string().nullable().optional(),
  description: z.string().min(1, 'Required'),
  hsn_sac: z.string().default(''),
  qty: z.coerce.number().positive('Must be > 0'),
  unit: z.string().default('NOS'),
  rate: z.coerce.number().min(0),
  sgst_percent: z.coerce.number().min(0).max(100).default(9),
  cgst_percent: z.coerce.number().min(0).max(100).default(9),
})

const schema = z.object({
  invoice_no: z.string().min(1),
  invoice_date: z.string().min(1),
  purchase_order_no: z.string().optional(),
  supplier_ref: z.string().optional(),
  delivery_note: z.string().optional(),
  other_reference: z.string().optional(),
  place_of_supply: z.string().optional(),
  bill_to_company_id: z.string().min(1, 'Required'),
  ship_to_company_id: z.string().optional(),
  payment_details: z.string().optional(),
  common_seal_text: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'generated', 'sent', 'paid']).default('draft'),
  lines: z.array(lineSchema).min(1),
})

type FormValues = z.infer<typeof schema>

export default function InvoiceDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const startEdit = searchParams.get('edit') === '1'

  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(startEdit)
  const [saving, setSaving] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const watchedLines = useWatch({ control, name: 'lines' })

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch('/api/companies').then((r) => r.json()),
      fetch('/api/items').then((r) => r.json()),
    ]).then(([inv, c, it]) => {
      setInvoice(inv)
      setCompanies(Array.isArray(c) ? c : [])
      setItems(Array.isArray(it) ? it : [])

      if (inv && !inv.error) {
        reset({
          invoice_no: inv.invoice_no,
          invoice_date: inv.invoice_date,
          purchase_order_no: inv.purchase_order_no ?? '',
          supplier_ref: inv.supplier_ref ?? '',
          delivery_note: inv.delivery_note ?? '',
          other_reference: inv.other_reference ?? '',
          place_of_supply: inv.place_of_supply ?? '',
          bill_to_company_id: inv.bill_to_company_id ?? '',
          ship_to_company_id: inv.ship_to_company_id ?? '',
          payment_details: inv.payment_details ?? '',
          common_seal_text: inv.common_seal_text ?? '',
          notes: inv.notes ?? '',
          status: inv.status,
          lines: (inv.invoice_items ?? []).map((li: any) => ({
            item_id: li.item_id ?? '',
            description: li.description ?? '',
            hsn_sac: li.hsn_sac ?? '',
            qty: li.qty,
            unit: li.unit ?? 'NOS',
            rate: li.rate,
            sgst_percent: li.sgst_percent,
            cgst_percent: li.cgst_percent,
          })),
        })
      }
      setLoading(false)
    })
  }, [id, reset])

  function applyItem(index: number, itemId: string) {
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    const half = Math.round(item.gst_percent / 2 * 100) / 100
    setValue(`lines.${index}.description`, item.item_name)
    setValue(`lines.${index}.hsn_sac`, item.hsn_sac ?? '')
    setValue(`lines.${index}.unit`, item.unit)
    setValue(`lines.${index}.rate`, item.default_rate)
    setValue(`lines.${index}.sgst_percent`, half)
    setValue(`lines.${index}.cgst_percent`, half)
    setValue(`lines.${index}.item_id`, itemId)
  }

  const calcLines = (watchedLines ?? []).map((l) =>
    calculateLine({
      item_id: l?.item_id ?? null,
      description: l?.description ?? '',
      hsn_sac: l?.hsn_sac ?? '',
      qty: Number(l?.qty) || 0,
      unit: l?.unit ?? 'NOS',
      rate: Number(l?.rate) || 0,
      sgst_percent: Number(l?.sgst_percent) || 0,
      cgst_percent: Number(l?.cgst_percent) || 0,
    } as InvoiceLineInput)
  )
  const totals = calculateTotals(calcLines)

  async function onSave(values: FormValues) {
    setSaving(true)
    setServerError('')
    try {
      const r = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, ship_to_company_id: values.ship_to_company_id || null }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to update')
      setInvoice(data)
      setEditMode(false)
      // Reload full invoice with relations
      const full = await fetch(`/api/invoices/${id}`).then((r) => r.json())
      setInvoice(full)
    } catch (e: any) {
      setServerError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function downloadPdf() {
    setPdfLoading(true)
    try {
      const r = await fetch(`/api/invoices/${id}/pdf`)
      if (!r.ok) { alert('PDF generation failed'); return }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice?.invoice_no}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      // Refresh status
      const full = await fetch(`/api/invoices/${id}`).then((r) => r.json())
      setInvoice(full)
    } finally {
      setPdfLoading(false)
    }
  }

  async function markPaid() {
    if (!confirm('Mark this invoice as paid?')) return
    const r = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...invoice, status: 'paid', lines: invoice?.invoice_items?.map((li: any) => ({
        item_id: li.item_id, description: li.description, hsn_sac: li.hsn_sac,
        qty: li.qty, unit: li.unit, rate: li.rate,
        sgst_percent: li.sgst_percent, cgst_percent: li.cgst_percent,
      })) }),
    })
    if (r.ok) {
      const full = await fetch(`/api/invoices/${id}`).then((r) => r.json())
      setInvoice(full)
    }
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>
  if (!invoice || (invoice as any).error) return (
    <div className="p-8">
      <p className="text-sm text-red-500">Invoice not found.</p>
      <Link href="/invoices" className="mt-2 inline-block text-sm text-blue-600">← Back to Invoices</Link>
    </div>
  )

  // ── View mode ────────────────────────────────────────────────────────────────
  if (!editMode) {
    const bill = invoice.bill_to_company
    const ship = invoice.ship_to_company
    const lineItems = invoice.invoice_items ?? []

    return (
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link href="/invoices" className="text-xs text-gray-400 hover:text-gray-600 mb-2 inline-block">← Invoices</Link>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_no}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[invoice.status]}`}>
                {invoice.status}
              </span>
              <span className="text-sm text-gray-500">{invoice.invoice_date}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {pdfLoading ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
            {invoice.status !== 'paid' && (
              <button
                onClick={markPaid}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                Mark Paid
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Bill To">
              {bill ? (
                <>
                  <p className="font-semibold text-gray-900">{bill.company_name}</p>
                  {bill.gstin && <p className="text-xs text-gray-500 font-mono mt-1">GSTIN: {bill.gstin}</p>}
                  <p className="text-sm text-gray-600 mt-1">
                    {[bill.address_line_1, bill.address_line_2, bill.city, bill.state, bill.pincode].filter(Boolean).join(', ')}
                  </p>
                  {bill.phone && <p className="text-sm text-gray-600">{bill.phone}</p>}
                  {bill.email && <p className="text-sm text-gray-600">{bill.email}</p>}
                </>
              ) : <p className="text-sm text-gray-400">—</p>}
            </InfoCard>
            <InfoCard title="Ship To">
              {(ship ?? bill) ? (
                <>
                  <p className="font-semibold text-gray-900">{(ship ?? bill)!.company_name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {[(ship ?? bill)!.address_line_1, (ship ?? bill)!.city, (ship ?? bill)!.state].filter(Boolean).join(', ')}
                  </p>
                </>
              ) : <p className="text-sm text-gray-400">—</p>}
            </InfoCard>
          </div>

          {/* Invoice meta */}
          <InfoCard title="Invoice Details">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <MetaRow label="Invoice No." value={invoice.invoice_no} />
              <MetaRow label="Invoice Date" value={invoice.invoice_date} />
              <MetaRow label="Place of Supply" value={invoice.place_of_supply} />
              <MetaRow label="P.O. No." value={invoice.purchase_order_no} />
              <MetaRow label="Supplier Ref" value={invoice.supplier_ref} />
              <MetaRow label="Delivery Note" value={invoice.delivery_note} />
            </div>
          </InfoCard>

          {/* Items table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">Items & Services</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">HSN/SAC</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-left">Unit</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-right">SGST</th>
                    <th className="px-4 py-2 text-right">CGST</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li: any, i: number) => (
                    <tr key={li.id} className="border-b border-gray-50">
                      <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2 text-gray-900">{li.description}</td>
                      <td className="px-4 py-2 text-gray-500 font-mono text-xs">{li.hsn_sac || '—'}</td>
                      <td className="px-4 py-2 text-right">{li.qty}</td>
                      <td className="px-4 py-2 text-gray-500">{li.unit}</td>
                      <td className="px-4 py-2 text-right">₹ {fmt(li.rate)}</td>
                      <td className="px-4 py-2 text-right">₹ {fmt(li.amount)}</td>
                      <td className="px-4 py-2 text-right text-xs">
                        {li.sgst_percent}% = ₹{fmt(li.sgst_amount)}
                      </td>
                      <td className="px-4 py-2 text-right text-xs">
                        {li.cgst_percent}% = ₹{fmt(li.cgst_amount)}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">₹ {fmt(li.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Amount in Words</p>
                <p className="text-sm text-gray-900 italic">{invoice.amount_in_words}</p>
              </div>
              <div className="space-y-1.5 text-sm min-w-55">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹ {fmt(invoice.subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Total SGST</span><span>₹ {fmt(invoice.total_sgst)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Total CGST</span><span>₹ {fmt(invoice.total_cgst)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                  <span>Grand Total</span><span>₹ {fmt(invoice.grand_total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes / payment */}
          {(invoice.payment_details || invoice.notes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoice.payment_details && (
                <InfoCard title="Payment Details">
                  <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.payment_details}</p>
                </InfoCard>
              )}
              {invoice.notes && (
                <InfoCard title="Notes">
                  <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                </InfoCard>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Edit mode ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setEditMode(false)} className="text-xs text-gray-400 hover:text-gray-600">← Cancel</button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
      </div>

      {serverError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{serverError}</div>
      )}

      <form className="space-y-6">
        <Section title="Invoice Details">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Invoice Number *" error={errors.invoice_no?.message}>
              <input {...register('invoice_no')} className={inp(!!errors.invoice_no)} />
            </Field>
            <Field label="Invoice Date *" error={errors.invoice_date?.message}>
              <input type="date" {...register('invoice_date')} className={inp(!!errors.invoice_date)} />
            </Field>
            <Field label="Place of Supply">
              <input {...register('place_of_supply')} className={inp()} />
            </Field>
            <Field label="P.O. No.">
              <input {...register('purchase_order_no')} className={inp()} />
            </Field>
            <Field label="Status">
              <select {...register('status')} className={inp()}>
                <option value="draft">Draft</option>
                <option value="generated">Generated</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Parties">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bill To *" error={errors.bill_to_company_id?.message}>
              <select {...register('bill_to_company_id')} className={inp(!!errors.bill_to_company_id)}>
                <option value="">Select…</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </Field>
            <Field label="Ship To">
              <select {...register('ship_to_company_id')} className={inp()}>
                <option value="">Same as Bill To</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Items">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-225">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                  <th className="pb-2 text-left pr-2 w-8">#</th>
                  <th className="pb-2 text-left pr-2 w-36">Catalog</th>
                  <th className="pb-2 text-left pr-2">Description *</th>
                  <th className="pb-2 text-left pr-2 w-24">HSN/SAC</th>
                  <th className="pb-2 text-right pr-2 w-16">Qty</th>
                  <th className="pb-2 text-left pr-2 w-16">Unit</th>
                  <th className="pb-2 text-right pr-2 w-24">Rate</th>
                  <th className="pb-2 text-right pr-2 w-20">SGST%</th>
                  <th className="pb-2 text-right pr-2 w-20">CGST%</th>
                  <th className="pb-2 text-right pr-2 w-24">Total</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fields.map((field, i) => {
                  const line = calcLines[i]
                  return (
                    <tr key={field.id} className="align-top">
                      <td className="pt-3 pr-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="pt-2 pr-2">
                        <select className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg" onChange={(e) => applyItem(i, e.target.value)} defaultValue="">
                          <option value="">Pick…</option>
                          {items.map((it) => <option key={it.id} value={it.id}>{it.item_name}</option>)}
                        </select>
                      </td>
                      <td className="pt-2 pr-2"><input {...register(`lines.${i}.description`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg" /></td>
                      <td className="pt-2 pr-2"><input {...register(`lines.${i}.hsn_sac`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg" /></td>
                      <td className="pt-2 pr-2"><input type="number" step="0.01" {...register(`lines.${i}.qty`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-right" /></td>
                      <td className="pt-2 pr-2"><input {...register(`lines.${i}.unit`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg" /></td>
                      <td className="pt-2 pr-2"><input type="number" step="0.01" {...register(`lines.${i}.rate`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-right" /></td>
                      <td className="pt-2 pr-2"><input type="number" step="0.01" {...register(`lines.${i}.sgst_percent`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-right" /></td>
                      <td className="pt-2 pr-2"><input type="number" step="0.01" {...register(`lines.${i}.cgst_percent`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-right" /></td>
                      <td className="pt-3 pr-2 text-right font-medium text-xs whitespace-nowrap">₹ {fmt(line?.total ?? 0)}</td>
                      <td className="pt-3">
                        {fields.length > 1 && <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => append({ item_id: '', description: '', hsn_sac: '', qty: 1, unit: 'NOS', rate: 0, sgst_percent: 9, cgst_percent: 9 })} className="mt-3 text-sm text-blue-600">+ Add Line</button>

          <div className="mt-5 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹ {fmt(totals.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>SGST</span><span>₹ {fmt(totals.total_sgst)}</span></div>
              <div className="flex justify-between text-gray-600"><span>CGST</span><span>₹ {fmt(totals.total_cgst)}</span></div>
              <div className="flex justify-between font-bold border-t border-gray-200 pt-2"><span>Grand Total</span><span>₹ {fmt(totals.grand_total)}</span></div>
            </div>
          </div>
        </Section>

        <Section title="Additional">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Payment Details"><textarea {...register('payment_details')} rows={3} className={inp()} /></Field>
            <Field label="Notes"><textarea {...register('notes')} rows={3} className={inp()} /></Field>
          </div>
        </Section>

        <div className="flex gap-3">
          <button type="button" onClick={handleSubmit((v) => onSave(v as FormValues))} disabled={saving} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => setEditMode(false)} className="px-6 py-2.5 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
        </div>
      </form>
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
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
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${hasError ? 'border-red-400' : 'border-gray-200'}`
}
