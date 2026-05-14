import { InkDabbaInvoicePDF } from './InkDabbaInvoicePDF'
import { EtcInvoicePDF } from './EtcInvoicePDF'
import { SeyonStudioInvoicePDF } from './SeyonStudioInvoicePDF'
import type { InvoiceWithRelations } from '@/lib/types/invoice'
import type React from 'react'

type PDFComponent = (props: {
  invoice: InvoiceWithRelations
  logoDataUrl: string | null
}) => React.ReactElement

export function getInvoicePDFComponent(company: string): PDFComponent {
  switch (company) {
    case 'inkdabba':
      return InkDabbaInvoicePDF as unknown as PDFComponent
    case 'etc':
      return EtcInvoicePDF as unknown as PDFComponent
    case 'seyon-studio':
      return SeyonStudioInvoicePDF as unknown as PDFComponent
    default:
      return InkDabbaInvoicePDF as unknown as PDFComponent
  }
}
