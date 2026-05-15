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

export interface CompanyTheme {
  // Sidebar
  sidebarBg: string
  sidebarBorder: string
  navActiveBg: string
  navActiveText: string
  navInactiveText: string
  navHoverBg: string
  logoText: string
  subText: string
  accentLink: string
  // CSS custom properties injected at layout level
  primary: string
  primaryHover: string
  primarySoft: string
  appBg: string
  cardBorder: string
  textMain: string
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
  theme: CompanyTheme
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
    theme: {
      sidebarBg:       '#FFFFFF',
      sidebarBorder:   '#E5E7EB',
      navActiveBg:     '#FFF0F8',
      navActiveText:   '#E6007E',
      navInactiveText: '#4A5568',
      navHoverBg:      '#FFF5FB',
      logoText:        '#111111',
      subText:         '#6B7280',
      accentLink:      '#E6007E',
      primary:         '#E6007E',
      primaryHover:    '#C9006F',
      primarySoft:     '#FFF0F8',
      appBg:           '#FAFAFC',
      cardBorder:      '#E5E7EB',
      textMain:        '#111111',
    },
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
    invoicePrefix: 'INV',
    description: 'Electronics & technology company',
    theme: {
      sidebarBg:       '#FFFFFF',
      sidebarBorder:   '#DDE7E2',
      navActiveBg:     '#E8F7F0',
      navActiveText:   '#008C5A',
      navInactiveText: '#4A5568',
      navHoverBg:      '#F0FAF6',
      logoText:        '#0B0F0D',
      subText:         '#6B7280',
      accentLink:      '#008C5A',
      primary:         '#008C5A',
      primaryHover:    '#00724A',
      primarySoft:     '#E8F7F0',
      appBg:           '#F7FAF8',
      cardBorder:      '#DDE7E2',
      textMain:        '#0B0F0D',
    },
    pdf: {
      name: 'ETC',
      tagline: 'Electronics & Technology Company',
      addressLine1: '34B, 3RD Avenue, KKR Nagar',
      addressLine2: 'Madhavaram',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600060',
      phone: '+91-9940183984',
      email: 'easwaritradingcompany@gmail.com',
      gstin: '33AAHPE5769M1ZC',
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
    logo: '/logoss.png',
    logoFile: 'logoss.png',
    route: '/seyon-studio',
    invoicePrefix: 'INV',
    description: 'Creative design studio',
    theme: {
      sidebarBg:       '#FFFFFF',
      sidebarBorder:   '#DDE7F7',
      navActiveBg:     '#EFF6FF',
      navActiveText:   '#2563EB',
      navInactiveText: '#4A5568',
      navHoverBg:      '#F5F9FF',
      logoText:        '#0B1220',
      subText:         '#6B7280',
      accentLink:      '#2563EB',
      primary:         '#2563EB',
      primaryHover:    '#1D4ED8',
      primarySoft:     '#EFF6FF',
      appBg:           '#F6F9FF',
      cardBorder:      '#DDE7F7',
      textMain:        '#0B1220',
    },
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
