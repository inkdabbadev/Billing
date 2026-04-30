import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { calculateLine, calculateTotals } from '@/lib/utils/calculateInvoice'

const lineSchema = z.object({
  item_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1, 'Description required'),
  hsn_sac: z.string().default(''),
  qty: z.number().positive('Qty must be positive'),
  unit: z.string().default('NOS'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  sgst_percent: z.number().min(0).max(100).default(9),
  cgst_percent: z.number().min(0).max(100).default(9),
})

const invoiceSchema = z.object({
  invoice_no: z.string().min(1, 'Invoice number required'),
  invoice_date: z.string().min(1, 'Invoice date required'),
  purchase_order_no: z.string().optional(),
  supplier_ref: z.string().optional(),
  delivery_note: z.string().optional(),
  other_reference: z.string().optional(),
  place_of_supply: z.string().optional(),
  bill_to_company_id: z.string().uuid('Bill-To company required'),
  ship_to_company_id: z.string().uuid().nullable().optional(),
  payment_details: z.string().optional(),
  common_seal_text: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'generated', 'sent', 'paid']).default('draft'),
  lines: z.array(lineSchema).min(1, 'At least one item is required'),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const search = request.nextUrl.searchParams.get('search') ?? ''
    const status = request.nextUrl.searchParams.get('status') ?? ''

    let query = supabase
      .from('invoices')
      .select(`
        *,
        bill_to_company:companies!invoices_bill_to_company_id_fkey(*),
        ship_to_company:companies!invoices_ship_to_company_id_fkey(*)
      `)
      .order('created_at', { ascending: false })

    if (search) query = query.ilike('invoice_no', `%${search}%`)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return Response.json(data)
  } catch {
    return Response.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = invoiceSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { lines, ...invoiceData } = parsed.data
    const supabase = createServerClient()

    // Check invoice_no uniqueness
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_no', invoiceData.invoice_no)
      .single()

    if (existing) {
      return Response.json(
        { error: 'Invoice number already exists' },
        { status: 409 }
      )
    }

    // Calculate
    const calculatedLines = lines.map((l) => calculateLine({ ...l, item_id: l.item_id ?? null }))
    const totals = calculateTotals(calculatedLines)

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({ ...invoiceData, ...totals })
      .select()
      .single()

    if (invErr) throw invErr

    const itemRows = calculatedLines.map((l) => ({
      invoice_id: invoice.id,
      item_id: l.item_id ?? null,
      description: l.description,
      hsn_sac: l.hsn_sac,
      qty: l.qty,
      unit: l.unit,
      rate: l.rate,
      amount: l.amount,
      sgst_percent: l.sgst_percent,
      sgst_amount: l.sgst_amount,
      cgst_percent: l.cgst_percent,
      cgst_amount: l.cgst_amount,
      total: l.total,
    }))

    const { error: itemErr } = await supabase.from('invoice_items').insert(itemRows)
    if (itemErr) throw itemErr

    return Response.json(invoice, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
