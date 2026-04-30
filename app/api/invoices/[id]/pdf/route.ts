import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'
import path from 'path'
import fs from 'fs'
import React from 'react'
import type { InvoiceWithRelations } from '@/lib/types/invoice'

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

    if (error || !data) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Read logo from public folder, convert to base64 data URL for @react-pdf/renderer
    const logoPath = path.join(process.cwd(), 'public', 'Logo.png')
    let logoDataUrl: string | null = null
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath)
      logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
    }

    // Promote status from draft → generated on first PDF download
    if (data.status === 'draft') {
      await supabase
        .from('invoices')
        .update({ status: 'generated' } satisfies { status: 'generated' })
        .eq('id', id)
    }

    const element = React.createElement(InvoicePDF, {
      invoice: data as unknown as InvoiceWithRelations,
      logoDataUrl,
    }) as React.ReactElement<import('@react-pdf/renderer').DocumentProps>

    // renderToBuffer returns Buffer; cast to Uint8Array for the Response BodyInit
    const pdfBuffer = await renderToBuffer(element)
    const uint8 = new Uint8Array(pdfBuffer)

    return new Response(uint8, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${data.invoice_no}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
