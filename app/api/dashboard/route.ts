import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()

    const [
      { data: invoices, error: invErr },
      { data: companies, error: coErr },
      { data: items, error: itErr },
      { data: invoiceItems, error: iiErr },
    ] = await Promise.all([
      supabase
        .from('invoicesink')
        .select(
          'id, invoice_no, invoice_date, grand_total, status, bill_to_company_id, bill_to_company:companies!bill_to_company_id(id, company_name, branch)'
        )
        .order('created_at', { ascending: false }),
      supabase.from('companies').select('*').order('company_name', { ascending: true }),
      supabase.from('items').select('*').order('item_name', { ascending: true }),
      supabase.from('invoice_itemsink').select('invoice_id, item_id').not('item_id', 'is', null),
    ])

    if (invErr) console.error('[GET /api/dashboard] invoices:', invErr)
    if (coErr) console.error('[GET /api/dashboard] companies:', coErr)
    if (itErr) console.error('[GET /api/dashboard] items:', itErr)
    if (iiErr) console.error('[GET /api/dashboard] invoice_itemsink:', iiErr)

    return Response.json({
      invoices: invoices ?? [],
      companies: companies ?? [],
      items: items ?? [],
      invoiceItems: (invoiceItems ?? []).filter((ii) => ii.item_id !== null),
    })
  } catch (err) {
    console.error('[GET /api/dashboard]', err)
    return Response.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
