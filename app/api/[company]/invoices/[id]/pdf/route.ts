import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getInvoicePDFComponent } from '@/components/invoice-pdf/getInvoicePDFComponent'
import path from 'path'
import fs from 'fs'
import React from 'react'
import { getCompanyConfig } from '@/lib/config/companies'
import type { InvoiceWithRelations } from '@/lib/types/invoice'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ company: string; id: string }> }
) {
  const { company, id } = await params
  const config = getCompanyConfig(company)
  if (!config) return Response.json({ error: 'Unknown company' }, { status: 404 })

  try {
    const supabase = createServerClient()

    const { data: invoice, error } = await supabase
      .from(config.invoiceTable)
      .select(`
        *,
        bill_to_company:companies!bill_to_company_id(*),
        ship_to_company:companies!ship_to_company_id(*)
      `)
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { data: invoiceItems } = await supabase
      .from(config.invoiceItemsTable)
      .select('*, item:items(*)')
      .eq('invoice_id', id)

    const fullInvoice = { ...invoice, invoice_items: invoiceItems ?? [] }

    const logoPath = path.join(process.cwd(), 'public', config.logoFile)
    let logoDataUrl: string | null = null
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath)
      logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
    }

    if (invoice.status === 'draft') {
      await supabase
        .from(config.invoiceTable)
        .update({ status: 'unpaid' } satisfies { status: 'unpaid' })
        .eq('id', id)
    }

    const PDFComponent = getInvoicePDFComponent(company)
    const element = React.createElement(PDFComponent, {
      invoice: fullInvoice as unknown as InvoiceWithRelations,
      logoDataUrl,
    }) as React.ReactElement<import('@react-pdf/renderer').DocumentProps>

    const pdfBuffer = await renderToBuffer(element)
    const uint8 = new Uint8Array(pdfBuffer)

    return new Response(uint8, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_no}.pdf"`,
      },
    })
  } catch (err) {
    console.error(`[GET /api/${company}/invoices/${id}/pdf]`, err)
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
