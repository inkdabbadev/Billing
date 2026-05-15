import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCompanyConfig } from '@/lib/config/companies'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ company: string }> }
) {
  const { company } = await params
  const config = getCompanyConfig(company)
  if (!config) return Response.json({ error: 'Unknown company' }, { status: 404 })

  try {
    const supabase = createServerClient()

    // Fetch invoices without embedded join — avoids PostgREST FK cache issues on renamed tables.
    const [
      { data: rawInvoices, error: invErr },
      { data: companies, error: coErr },
      { data: items, error: itErr },
    ] = await Promise.all([
      supabase
        .from(config.invoiceTable)
        .select('id, invoice_no, invoice_date, grand_total, status, bill_to_company_id')
        .order('created_at', { ascending: false }),
      supabase.from('companies').select('*').order('company_name', { ascending: true }),
      supabase.from('items').select('*').order('item_name', { ascending: true }),
    ])

    if (invErr) console.error(`[GET /api/${company}/dashboard] table=${config.invoiceTable}`, invErr)
    if (coErr) console.error(`[GET /api/${company}/dashboard] companies:`, coErr)
    if (itErr) console.error(`[GET /api/${company}/dashboard] items:`, itErr)

    // Merge company data in JS using the already-fetched companies list.
    const companiesMap: Record<string, any> = {}
    for (const c of companies ?? []) companiesMap[c.id] = c

    const invoices = (rawInvoices ?? []).map((inv: any) => ({
      ...inv,
      bill_to_company: companiesMap[inv.bill_to_company_id] ?? null,
    }))

    // Fetch invoice_items only for invoices belonging to this company.
    const invoiceIds = invoices.map((i: any) => i.id)
    let invoiceItems: { invoice_id: string; item_id: string }[] = []
    if (invoiceIds.length > 0) {
      const { data: ii, error: iiErr } = await supabase
        .from(config.invoiceItemsTable)
        .select('invoice_id, item_id, total')
        .in('invoice_id', invoiceIds)
        .not('item_id', 'is', null)
      if (iiErr) console.error(`[GET /api/${company}/dashboard] ${config.invoiceItemsTable}:`, iiErr)
      invoiceItems = (ii ?? []).filter((row) => row.item_id !== null)
    }

    return Response.json({
      invoices,
      companies: companies ?? [],
      items: items ?? [],
      invoiceItems,
    })
  } catch (err) {
    console.error(`[GET /api/${company}/dashboard]`, err)
    return Response.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
