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
  payment_method_id: z.string().uuid().nullable().optional(),
  payment_details: z.string().optional(),
  common_seal_text: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'unpaid', 'paid']).default('draft'),
  lines: z.array(lineSchema).min(1, 'At least one item is required'),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const search = request.nextUrl.searchParams.get('search') ?? ''
    const status = request.nextUrl.searchParams.get('status') ?? ''

    let query = supabase
      .from('invoicesink')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) query = query.ilike('invoice_no', `%${search}%`)
    if (status) query = query.eq('status', status)

    const { data: invoices, error: invError } = await query
    if (invError) {
      console.error('[GET /api/invoices]', invError)
      throw invError
    }

    const companyIds = [
      ...new Set(
        (invoices ?? [])
          .flatMap((inv: any) => [inv.bill_to_company_id, inv.ship_to_company_id])
          .filter(Boolean)
      ),
    ]

    const companiesMap: Record<string, any> = {}
    if (companyIds.length > 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds)
      for (const c of companies ?? []) companiesMap[c.id] = c
    }

    const result = (invoices ?? []).map((inv: any) => ({
      ...inv,
      bill_to_company: companiesMap[inv.bill_to_company_id] ?? null,
      ship_to_company: companiesMap[inv.ship_to_company_id] ?? null,
    }))

    return Response.json(result)
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

    const { data: existing } = await supabase
      .from('invoicesink')
      .select('id')
      .eq('invoice_no', invoiceData.invoice_no)
      .single()

    if (existing) {
      return Response.json({ error: 'Invoice number already exists' }, { status: 409 })
    }

    const calculatedLines = lines.map((l) => calculateLine({ ...l, item_id: l.item_id ?? null }))
    const totals = calculateTotals(calculatedLines)

    const { data: invoice, error: invErr } = await supabase
      .from('invoicesink')
      .insert({ ...invoiceData, ...totals })
      .select()
      .single()

    if (invErr) {
      return Response.json({ error: 'Failed to create invoice', details: invErr.message }, { status: 500 })
    }

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

    const { error: itemErr } = await supabase.from('invoice_itemsink').insert(itemRows)
    if (itemErr) {
      await supabase.from('invoicesink').delete().eq('id', invoice.id)
      return Response.json({ error: 'Failed to create invoice items', details: itemErr.message }, { status: 500 })
    }

    return Response.json(invoice, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
