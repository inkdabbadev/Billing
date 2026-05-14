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

  const prefix = config.invoicePrefix

  try {
    const supabase = createServerClient()

    const { data } = await supabase
      .from(config.invoiceTable)
      .select('invoice_no')
      .like('invoice_no', `${prefix}-%`)
      .order('created_at', { ascending: false })
      .limit(20)

    let nextNum = 1
    for (const row of data ?? []) {
      const match = row.invoice_no?.match(new RegExp(`^${prefix}-(\\d+)$`))
      if (match) {
        nextNum = parseInt(match[1], 10) + 1
        break
      }
    }

    return Response.json({ next: `${prefix}-${String(nextNum).padStart(3, '0')}` })
  } catch {
    return Response.json({ next: `${prefix}-001` })
  }
}
