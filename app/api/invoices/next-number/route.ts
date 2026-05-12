import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data } = await supabase
      .from('invoices')
      .select('invoice_no')
      .like('invoice_no', 'INV-%')
      .order('created_at', { ascending: false })
      .limit(20)

    let nextNum = 1
    for (const row of data ?? []) {
      const match = row.invoice_no?.match(/^INV-(\d+)$/)
      if (match) {
        nextNum = parseInt(match[1], 10) + 1
        break
      }
    }

    const next = `INV-${String(nextNum).padStart(3, '0')}`
    return Response.json({ next })
  } catch {
    return Response.json({ next: 'INV-001' })
  }
}
