import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InkDabbaInvoicePDF } from '@/components/invoice-pdf/InkDabbaInvoicePDF'
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

    const { data: invoice, error } = await supabase
      .from('invoicesink')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !invoice) {
      console.error('[GET /api/invoices/[id]/pdf] invoicesink', error)
      return Response.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const companyIds = [invoice.bill_to_company_id, invoice.ship_to_company_id].filter(Boolean)
    const companiesMap: Record<string, any> = {}
    if (companyIds.length > 0) {
      const { data: companies } = await supabase.from('companies').select('*').in('id', companyIds)
      for (const c of companies ?? []) companiesMap[c.id] = c
    }

    const { data: invoiceItems } = await supabase
      .from('invoice_itemsink')
      .select('*, item:items(*)')
      .eq('invoice_id', id)

    const data = {
      ...invoice,
      bill_to_company: companiesMap[invoice.bill_to_company_id] ?? null,
      ship_to_company: companiesMap[invoice.ship_to_company_id] ?? null,
      invoice_items: invoiceItems ?? [],
    }

    const logoPath = path.join(process.cwd(), 'public', 'Logoink.png')
    let logoDataUrl: string | null = null
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath)
      logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`
    }

    if (data.status === 'draft') {
      await supabase
        .from('invoicesink')
        .update({ status: 'unpaid' } satisfies { status: 'unpaid' })
        .eq('id', id)
    }

    const element = React.createElement(InkDabbaInvoicePDF, {
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
