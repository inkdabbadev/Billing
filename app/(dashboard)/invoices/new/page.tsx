'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Company, Item } from '@/lib/types/database'
import { calculateLine, calculateTotals, fmt } from '@/lib/utils/calculateInvoice'
import type { InvoiceLineInput } from '@/lib/types/invoice'

const lineSchema = z.object({
  item_id: z.string().nullable().optional(),
  description: z.string().min(1, 'Required'),
  hsn_sac: z.string().default(''),
  qty: z.coerce.number().positive('Must be > 0'),
  unit: z.string().default('NOS'),
  rate: z.coerce.number().min(0, 'Cannot be negative'),
  sgst_percent: z.coerce.number().min(0).max(100).default(9),
  cgst_percent: z.coerce.number().min(0).max(100).default(9),
})

const schema = z.object({
  invoice_no: z.string().min(1, 'Invoice number required'),
  invoice_date: z.string().min(1, 'Date required'),
  purchase_order_no: z.string().optional(),
  supplier_ref: z.string().optional(),
  delivery_note: z.string().optional(),
  other_reference: z.string().optional(),
  place_of_supply: z.string().optional(),
  bill_to_company_id: z.string().min(1, 'Bill-To company required'),
  ship_to_company_id: z.string().optional(),
  payment_details: z.string().optional(),
  common_seal_text: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'generated', 'sent', 'paid']).default('draft'),
  lines: z.array(lineSchema).min(1, 'At least one item required'),
})

type FormValues = z.infer<typeof schema>

const BLANK_LINE = {
  item_id: '',
  description: '',
  hsn_sac: '',
  qty: 1,
  unit: 'NOS',
  rate: 0,
  sgst_percent: 9,
  cgst_percent: 9,
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [saving, setSaving] = useState(false)
  const [savingPdf, setSavingPdf] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      invoice_date: new Date().toISOString().slice(0, 10),
      status: 'draft',
      lines: [{ ...BLANK_LINE }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const watchedLines = useWatch({ control, name: 'lines' })

  useEffect(() => {
    Promise.all([
      fetch('/api/companies').then((r) => r.json()),
      fetch('/api/items').then((r) => r.json()),
    ]).then(([c, i]) => {
      setCompanies(Array.isArray(c) ? c : [])
      setItems(Array.isArray(i) ? i : [])
    })
  }, [])

  // When an item is selected from the catalog, prefill the line
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

  // Live totals
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

  async function submit(values: FormValues, generatePdf = false) {
    setSaving(true)
    setServerError('')
    try {
      const r = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          ship_to_company_id: values.ship_to_company_id || null,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed to save invoice')

      if (generatePdf) {
        setSavingPdf(true)
        const pr = await fetch(`/api/invoices/${data.id}/pdf`)
        if (pr.ok) {
          const blob = await pr.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `invoice-${values.invoice_no}.pdf`
          a.click()
          URL.revokeObjectURL(url)
        }
      }

      router.push(`/invoices/${data.id}`)
    } catch (e: any) {
      setServerError(e.message)
    } finally {
      setSaving(false)
      setSavingPdf(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details below to create an invoice</p>
      </div>

      {serverError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form className="space-y-6">
        {/* ── Invoice Meta ── */}
        <Section title="Invoice Details">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Invoice Number *" error={errors.invoice_no?.message}>
              <input {...register('invoice_no')} className={inp(!!errors.invoice_no)} placeholder="INK-2025-001" />
            </Field>
            <Field label="Invoice Date *" error={errors.invoice_date?.message}>
              <input type="date" {...register('invoice_date')} className={inp(!!errors.invoice_date)} />
            </Field>
            <Field label="Place of Supply">
              <input {...register('place_of_supply')} className={inp()} placeholder="Telangana" />
            </Field>
            <Field label="Purchase Order No.">
              <input {...register('purchase_order_no')} className={inp()} placeholder="PO-001" />
            </Field>
            <Field label="Supplier Ref">
              <input {...register('supplier_ref')} className={inp()} placeholder="SR-001" />
            </Field>
            <Field label="Delivery Note">
              <input {...register('delivery_note')} className={inp()} placeholder="DN-001" />
            </Field>
          </div>
        </Section>

        {/* ── Company Selection ── */}
        <Section title="Parties">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Bill To (Client) *" error={errors.bill_to_company_id?.message}>
              <select {...register('bill_to_company_id')} className={inp(!!errors.bill_to_company_id)}>
                <option value="">Select company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name} {c.city ? `– ${c.city}` : ''}</option>
                ))}
              </select>
            </Field>
            <Field label="Ship To (optional – defaults to Bill To)">
              <select {...register('ship_to_company_id')} className={inp()}>
                <option value="">Same as Bill To</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name} {c.city ? `– ${c.city}` : ''}</option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        {/* ── Line Items ── */}
        <Section title="Items & Services">
          {(errors.lines as any)?.message && (
            <p className="text-xs text-red-600 mb-3">{(errors.lines as any).message}</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-225">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                  <th className="pb-2 text-left pr-2 w-8">#</th>
                  <th className="pb-2 text-left pr-2 w-40">Catalog</th>
                  <th className="pb-2 text-left pr-2">Description *</th>
                  <th className="pb-2 text-left pr-2 w-24">HSN/SAC</th>
                  <th className="pb-2 text-right pr-2 w-16">Qty</th>
                  <th className="pb-2 text-left pr-2 w-20">Unit</th>
                  <th className="pb-2 text-right pr-2 w-24">Rate (₹)</th>
                  <th className="pb-2 text-right pr-2 w-20">SGST%</th>
                  <th className="pb-2 text-right pr-2 w-20">CGST%</th>
                  <th className="pb-2 text-right pr-2 w-24">Total</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fields.map((field, i) => {
                  const line = calcLines[i]
                  const lineErrors = (errors.lines as any)?.[i]
                  return (
                    <tr key={field.id} className="align-top">
                      <td className="pt-3 pr-2 text-gray-400 text-xs">{i + 1}</td>

                      {/* Catalog picker */}
                      <td className="pt-2 pr-2">
                        <select
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                          onChange={(e) => applyItem(i, e.target.value)}
                          defaultValue=""
                        >
                          <option value="">Pick item…</option>
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>{it.item_name}</option>
                          ))}
                        </select>
                      </td>

                      <td className="pt-2 pr-2">
                        <input
                          {...register(`lines.${i}.description`)}
                          className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 ${lineErrors?.description ? 'border-red-400' : 'border-gray-200'}`}
                          placeholder="Description"
                        />
                        {lineErrors?.description && <p className="text-red-500 text-xs mt-0.5">{lineErrors.description.message}</p>}
                      </td>

                      <td className="pt-2 pr-2">
                        <input {...register(`lines.${i}.hsn_sac`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="998912" />
                      </td>

                      <td className="pt-2 pr-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`lines.${i}.qty`)}
                          className={`w-full px-2 py-1.5 text-xs border rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-gray-900 ${lineErrors?.qty ? 'border-red-400' : 'border-gray-200'}`}
                        />
                      </td>

                      <td className="pt-2 pr-2">
                        <input {...register(`lines.${i}.unit`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none" placeholder="NOS" />
                      </td>

                      <td className="pt-2 pr-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`lines.${i}.rate`)}
                          className={`w-full px-2 py-1.5 text-xs border rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-gray-900 ${lineErrors?.rate ? 'border-red-400' : 'border-gray-200'}`}
                        />
                      </td>

                      <td className="pt-2 pr-2">
                        <input type="number" step="0.01" {...register(`lines.${i}.sgst_percent`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-right focus:outline-none" />
                      </td>

                      <td className="pt-2 pr-2">
                        <input type="number" step="0.01" {...register(`lines.${i}.cgst_percent`)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-right focus:outline-none" />
                      </td>

                      <td className="pt-3 pr-2 text-right font-medium text-gray-900 text-xs whitespace-nowrap">
                        ₹ {fmt(line?.total ?? 0)}
                      </td>

                      <td className="pt-3">
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => append({ ...BLANK_LINE })}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Line
          </button>

          {/* Totals */}
          <div className="mt-5 flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹ {fmt(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total SGST</span>
                <span>₹ {fmt(totals.total_sgst)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total CGST</span>
                <span>₹ {fmt(totals.total_cgst)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Grand Total</span>
                <span>₹ {fmt(totals.grand_total)}</span>
              </div>
              <p className="text-xs text-gray-400 italic">{totals.amount_in_words}</p>
            </div>
          </div>
        </Section>

        {/* ── Additional Details ── */}
        <Section title="Additional Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Payment Details / Bank Account">
              <textarea
                {...register('payment_details')}
                rows={3}
                className={inp()}
                placeholder="Bank name, account number, IFSC…"
              />
            </Field>
            <Field label="Notes / Terms">
              <textarea
                {...register('notes')}
                rows={3}
                className={inp()}
                placeholder="Payment terms, delivery notes…"
              />
            </Field>
            <Field label="Common Seal / Signatory Text">
              <input {...register('common_seal_text')} className={inp()} placeholder="Authorised Signatory" />
            </Field>
          </div>
        </Section>

        {/* ── Actions ── */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSubmit((v) => submit(v as FormValues, false))()}
            disabled={saving}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {saving && !savingPdf ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit((v) => submit(v as FormValues, true))()}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {savingPdf ? 'Generating PDF…' : 'Save & Download PDF'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </form>
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
  return `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${
    hasError ? 'border-red-400' : 'border-gray-200'
  }`
}
