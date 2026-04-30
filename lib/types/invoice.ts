import type { Company, Invoice, InvoiceItem, Item } from './database'

export interface InvoiceWithRelations extends Invoice {
  bill_to_company: Company | null
  ship_to_company: Company | null
  invoice_items: (InvoiceItem & { item: Item | null })[]
}

export interface InvoiceLineInput {
  item_id: string | null
  description: string
  hsn_sac: string
  qty: number
  unit: string
  rate: number
  sgst_percent: number
  cgst_percent: number
}

export interface InvoiceFormValues {
  invoice_no: string
  invoice_date: string
  purchase_order_no: string
  supplier_ref: string
  delivery_note: string
  other_reference: string
  place_of_supply: string
  bill_to_company_id: string
  ship_to_company_id: string
  payment_details: string
  common_seal_text: string
  notes: string
  status: 'draft' | 'generated' | 'sent' | 'paid'
  lines: InvoiceLineInput[]
}

export interface CalculatedLine {
  item_id: string | null
  description: string
  hsn_sac: string
  qty: number
  unit: string
  rate: number
  amount: number
  sgst_percent: number
  sgst_amount: number
  cgst_percent: number
  cgst_amount: number
  total: number
}

export interface InvoiceTotals {
  subtotal: number
  total_sgst: number
  total_cgst: number
  grand_total: number
  amount_in_words: string
}
