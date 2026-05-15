import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()

    const [
      { data: rawInvoices, error: invErr },
      { data: companies, error: coErr },
      { data: items, error: itErr },
      { data: invoiceItems, error: iiErr },
    ] = await Promise.all([
      supabase
        .from('invoicesink')
        .select('id, invoice_no, invoice_date, grand_total, status, bill_to_company_id')
        .order('created_at', { ascending: false }),
      supabase.from('companies').select('*').order('company_name', { ascending: true }),
      supabase.from('items').select('*').order('item_name', { ascending: true }),
      supabase.from('invoice_itemsink').select('invoice_id, item_id, total').not('item_id', 'is', null),
    ])

    if (invErr) console.error('[GET /api/dashboard] invoicesink:', invErr)
    if (coErr) console.error('[GET /api/dashboard] companies:', coErr)
    if (itErr) console.error('[GET /api/dashboard] items:', itErr)
    if (iiErr) console.error('[GET /api/dashboard] invoice_itemsink:', iiErr)

    const companiesMap: Record<string, any> = {}
    for (const c of companies ?? []) companiesMap[c.id] = c

    const invoices = (rawInvoices ?? []).map((inv: any) => ({
      ...inv,
      bill_to_company: companiesMap[inv.bill_to_company_id] ?? null,
    }))

    return Response.json({
      invoices,
      companies: companies ?? [],
      items: items ?? [],
      invoiceItems: (invoiceItems ?? []).filter((ii) => ii.item_id !== null),
    })
  } catch (err) {
    console.error('[GET /api/dashboard]', err)
    return Response.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
