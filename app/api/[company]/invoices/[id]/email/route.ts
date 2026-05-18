import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCompanyConfig } from '@/lib/config/companies'
import { buildInvoiceEmailHtml } from '@/lib/email/invoiceEmailHtml'
import { renderToBuffer } from '@react-pdf/renderer'
import { getInvoicePDFComponent } from '@/components/invoice-pdf/getInvoicePDFComponent'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import path from 'path'
import fs from 'fs'
import React from 'react'
import type { InvoiceWithRelations } from '@/lib/types/invoice'

const bodySchema = z.object({
  to: z.string().email('Invalid email address'),
  saveEmail: z.boolean(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ company: string; id: string }> }
) {
  const { company, id } = await params
  const config = getCompanyConfig(company)
  if (!config) return Response.json({ error: 'Unknown company' }, { status: 404 })

  const raw = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.to?.[0] ?? 'Invalid request'
    return Response.json({ error: msg }, { status: 400 })
  }
  const { to, saveEmail } = parsed.data

  try {
    const supabase = createServerClient()

    // Fetch invoice
    const { data: invoice, error: invErr } = await supabase
      .from(config.invoiceTable)
      .select('*')
      .eq('id', id)
      .single()

    if (invErr || !invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch related companies
    const companyIds = [invoice.bill_to_company_id, invoice.ship_to_company_id].filter(Boolean)
    const companiesMap: Record<string, any> = {}
    if (companyIds.length > 0) {
      const { data: cos } = await supabase.from('companies').select('*').in('id', companyIds)
      for (const c of cos ?? []) companiesMap[c.id] = c
    }

    // Fetch invoice items
    const { data: invoiceItems } = await supabase
      .from(config.invoiceItemsTable)
      .select('*, item:items(*)')
      .eq('invoice_id', id)

    const fullInvoice: InvoiceWithRelations = {
      ...invoice,
      bill_to_company: companiesMap[invoice.bill_to_company_id] ?? null,
      ship_to_company: companiesMap[invoice.ship_to_company_id] ?? null,
      invoice_items: invoiceItems ?? [],
    }

    // Optionally save email to company record
    if (saveEmail && invoice.bill_to_company_id) {
      await supabase
        .from('companies')
        .update({ email: to })
        .eq('id', invoice.bill_to_company_id)
    }

    // Load logo
    const logoPath = path.join(process.cwd(), 'public', config.logoFile)
    let logoDataUrl: string | null = null
    if (fs.existsSync(logoPath)) {
      logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    }

    // Generate PDF attachment
    const PDFComponent = getInvoicePDFComponent(company)
    const pdfElement = React.createElement(PDFComponent, {
      invoice: fullInvoice as unknown as InvoiceWithRelations,
      logoDataUrl,
    }) as React.ReactElement<import('@react-pdf/renderer').DocumentProps>
    const pdfBuffer = await renderToBuffer(pdfElement)

    // Build HTML email
    const html = buildInvoiceEmailHtml(fullInvoice, config)

    // Attachments: logo (CID) + PDF
    const attachments: nodemailer.SendMailOptions['attachments'] = [
      {
        filename: `invoice-${invoice.invoice_no}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: 'application/pdf',
      },
    ]
    if (fs.existsSync(logoPath)) {
      attachments.unshift({
        filename: config.logoFile,
        path: logoPath,
        cid: 'company-logo',
      })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: `"${config.pdf.name}" <${process.env.MAIL_USER}>`,
      to,
      subject: `Invoice ${invoice.invoice_no} from ${config.pdf.name}`,
      html,
      attachments,
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error(`[POST /api/${company}/invoices/${id}/email]`, err)
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
