export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Company {
  id: string
  company_name: string
  gstin: string | null
  email: string | null
  phone: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  pincode: string | null
  country: string
  is_client: boolean
  is_supplier: boolean
  created_at: string
  updated_at: string
}

export interface CompanyInsert {
  id?: string
  company_name: string
  gstin?: string | null
  email?: string | null
  phone?: string | null
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  country?: string
  is_client?: boolean
  is_supplier?: boolean
  created_at?: string
  updated_at?: string
}

export interface Item {
  id: string
  item_name: string
  description: string | null
  hsn_sac: string | null
  unit: string
  default_rate: number
  gst_percent: number
  category: string | null
  created_at: string
  updated_at: string
}

export interface ItemInsert {
  id?: string
  item_name: string
  description?: string | null
  hsn_sac?: string | null
  unit?: string
  default_rate: number
  gst_percent?: number
  category?: string | null
  created_at?: string
  updated_at?: string
}

export interface Invoice {
  id: string
  invoice_no: string
  invoice_date: string
  purchase_order_no: string | null
  supplier_ref: string | null
  delivery_note: string | null
  other_reference: string | null
  place_of_supply: string | null
  bill_to_company_id: string | null
  ship_to_company_id: string | null
  subtotal: number
  total_sgst: number
  total_cgst: number
  grand_total: number
  amount_in_words: string | null
  payment_details: string | null
  common_seal_text: string | null
  notes: string | null
  status: 'draft' | 'generated' | 'sent' | 'paid'
  created_at: string
  updated_at: string
}

export interface InvoiceInsert {
  id?: string
  invoice_no: string
  invoice_date: string
  purchase_order_no?: string | null
  supplier_ref?: string | null
  delivery_note?: string | null
  other_reference?: string | null
  place_of_supply?: string | null
  bill_to_company_id?: string | null
  ship_to_company_id?: string | null
  subtotal?: number
  total_sgst?: number
  total_cgst?: number
  grand_total?: number
  amount_in_words?: string | null
  payment_details?: string | null
  common_seal_text?: string | null
  notes?: string | null
  status?: 'draft' | 'generated' | 'sent' | 'paid'
  created_at?: string
  updated_at?: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  item_id: string | null
  description: string | null
  hsn_sac: string | null
  qty: number
  unit: string | null
  rate: number
  amount: number
  sgst_percent: number
  sgst_amount: number
  cgst_percent: number
  cgst_amount: number
  total: number
  created_at: string
}

export interface InvoiceItemInsert {
  id?: string
  invoice_id: string
  item_id?: string | null
  description?: string | null
  hsn_sac?: string | null
  qty: number
  unit?: string | null
  rate: number
  amount: number
  sgst_percent?: number
  sgst_amount?: number
  cgst_percent?: number
  cgst_amount?: number
  total: number
  created_at?: string
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company
        Insert: CompanyInsert
        Update: Partial<CompanyInsert>
        Relationships: []
      }
      items: {
        Row: Item
        Insert: ItemInsert
        Update: Partial<ItemInsert>
        Relationships: []
      }
      invoices: {
        Row: Invoice
        Insert: InvoiceInsert
        Update: Partial<InvoiceInsert>
        Relationships: [
          {
            foreignKeyName: 'invoices_bill_to_company_id_fkey'
            columns: ['bill_to_company_id']
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_ship_to_company_id_fkey'
            columns: ['ship_to_company_id']
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      invoice_items: {
        Row: InvoiceItem
        Insert: InvoiceItemInsert
        Update: Partial<InvoiceItemInsert>
        Relationships: [
          {
            foreignKeyName: 'invoice_items_invoice_id_fkey'
            columns: ['invoice_id']
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoice_items_item_id_fkey'
            columns: ['item_id']
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
