export type CompanyId = 'inkdabba' | 'etc' | 'seyon-studio'

export interface CompanyPdfConfig {
  name: string
  tagline: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  gstin: string
  bank: {
    accountName: string
    bankName: string
    accountNo: string
    ifsc: string
    branch: string
  }
  defaultFooterNote: string
}

export interface CompanyConfig {
  id: CompanyId
  name: string
  invoiceTable: string
  invoiceItemsTable: string
  logo: string
  logoFile: string
  route: string
  invoicePrefix: string
  description: string
  pdf: CompanyPdfConfig
}

export const COMPANY_CONFIGS: Record<CompanyId, CompanyConfig> = {
  inkdabba: {
    id: 'inkdabba',
    name: 'INK DABBA',
    invoiceTable: 'invoicesink',
    invoiceItemsTable: 'invoice_itemsink',
    logo: '/Logoink.png',
    logoFile: 'Logoink.png',
    route: '/inkdabba',
    invoicePrefix: 'INV',
    description: 'Screen printing & branding studio',
    pdf: {
      name: 'INK DABBA',
      tagline: '296/1, Susheel Homes',
      addressLine1: 'Belly area',
      addressLine2: 'Annanagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600040',
      phone: '+91-99401 83984',
      email: 'bhuvanesh@inkdabba.com',
      gstin: '33DAOPB2696J1ZF',
      bank: {
        accountName: 'Bhuvaneshwaran',
        bankName: 'AXIS Bank',
        accountNo: '920010002148814',
        ifsc: 'UTIB0004583',
        branch: 'Hyderabad – Hitech City',
      },
      defaultFooterNote: 'Computer Generated Invoice – No Signature Required',
    },
  },
  etc: {
    id: 'etc',
    name: 'ETC',
    invoiceTable: 'invoicesetc',
    invoiceItemsTable: 'invoice_itemsetc',
    logo: '/Logoetc.png',
    logoFile: 'Logoetc.png',
    route: '/etc',
    invoicePrefix: 'ETC',
    description: 'Electronics & technology company',
    pdf: {
      name: 'ETC',
      tagline: 'Electronics & Technology Company',
      addressLine1: 'Address Line 1',
      addressLine2: 'Address Line 2',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      phone: '+91-00000 00000',
      email: 'info@etc.com',
      gstin: '',
      bank: {
        accountName: 'ETC',
        bankName: 'Bank Name',
        accountNo: '000000000000000',
        ifsc: 'XXXX0000000',
        branch: 'Branch Name',
      },
      defaultFooterNote: 'Computer Generated Invoice – No Signature Required',
    },
  },
  'seyon-studio': {
    id: 'seyon-studio',
    name: 'SEYON STUDIO',
    invoiceTable: 'invoicesss',
    invoiceItemsTable: 'invoice_itemsss',
    logo: '/Logoss.png',
    logoFile: 'Logoss.png',
    route: '/seyon-studio',
    invoicePrefix: 'SS',
    description: 'Creative design studio',
    pdf: {
      name: 'SEYON STUDIO',
      tagline: 'Creative Design Studio',
      addressLine1: 'Address Line 1',
      addressLine2: 'Address Line 2',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      phone: '+91-00000 00000',
      email: 'info@seyonstudio.com',
      gstin: '',
      bank: {
        accountName: 'Seyon Studio',
        bankName: 'Bank Name',
        accountNo: '000000000000000',
        ifsc: 'XXXX0000000',
        branch: 'Branch Name',
      },
      defaultFooterNote: 'Computer Generated Invoice – No Signature Required',
    },
  },
}

export function getCompanyConfig(id: string): CompanyConfig | null {
  return COMPANY_CONFIGS[id as CompanyId] ?? null
}

export const COMPANY_IDS = Object.keys(COMPANY_CONFIGS) as CompanyId[]
