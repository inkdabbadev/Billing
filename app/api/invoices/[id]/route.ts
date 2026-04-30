import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { calculateLine, calculateTotals } from '@/lib/utils/calculateInvoice'

const lineSchema = z.object({
  item_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1),
  hsn_sac: z.string().default(''),
  qty: z.number().positive(),
  unit: z.string().default('NOS'),
  rate: z.number().min(0),
  sgst_percent: z.number().min(0).max(100).default(9),
  cgst_percent: z.number().min(0).max(100).default(9),
})

const invoiceSchema = z.object({
  invoice_no: z.string().min(1),
  invoice_date: z.string().min(1),
  purchase_order_no: z.string().optional(),
  supplier_ref: z.string().optional(),
  delivery_note: z.string().optional(),
  other_reference: z.string().optional(),
  place_of_supply: z.string().optional(),
  bill_to_company_id: z.string().uuid(),
  ship_to_company_id: z.string().uuid().nullable().optional(),
  payment_details: z.string().optional(),
  common_seal_text: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'generated', 'sent', 'paid']).default('draft'),
  lines: z.array(lineSchema).min(1),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        bill_to_company:companies!invoices_bill_to_company_id_fkey(*),
        ship_to_company:companies!invoices_ship_to_company_id_fkey(*),
        invoice_items(*, item:items(*))
      `)
      .eq('id', id)
      .single()

    if (error) return Response.json({ error: 'Invoice not found' }, { status: 404 })
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = invoiceSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { lines, ...invoiceData } = parsed.data
    const supabase = createServerClient()

    const calculatedLines = lines.map((l) => calculateLine({ ...l, item_id: l.item_id ?? null }))
    const totals = calculateTotals(calculatedLines)

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .update({ ...invoiceData, ...totals })
      .eq('id', id)
      .select()
      .single()

    if (invErr) throw invErr

    // Replace invoice items
    await supabase.from('invoice_items').delete().eq('invoice_id', id)

    const itemRows = calculatedLines.map((l) => ({
      invoice_id: id,
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

    return Response.json(invoice)
  } catch {
    return Response.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
