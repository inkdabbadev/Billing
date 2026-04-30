import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  type Styles,
} from '@react-pdf/renderer'
import { BUSINESS } from '@/lib/config/business'
import { fmt } from '@/lib/utils/calculateInvoice'
import type { InvoiceWithRelations } from '@/lib/types/invoice'

// ── Palette ───────────────────────────────────────────────────────────────────

const C = {
  heroBlue:    '#EEF4FF',
  stripGray:   '#F8FAFC',
  cardBg:      '#FFFFFF',
  navy:        '#1E293B',
  dark:        '#0F172A',
  muted:       '#64748B',
  border:      '#E2E8F0',
  borderDark:  '#CBD5E1',
  accent:      '#1D4ED8',
  accentLight: '#DBEAFE',
  white:       '#FFFFFF',
  rowAlt:      '#F8FAFC',
  taxHeaderBg: '#F1F5F9',
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: C.dark,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 28,
    backgroundColor: C.white,
  },

  // ── Hero header block ──
  hero: {
    flexDirection: 'row',
    backgroundColor: C.heroBlue,
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 14,
    borderRight: `1pt solid ${C.border}`,
  },
  heroRight: {
    flex: 1,
    paddingLeft: 14,
    alignItems: 'flex-end',
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    letterSpacing: 1,
    marginBottom: 10,
  },
  heroMetaLabel: {
    fontSize: 6.5,
    color: C.muted,
    marginBottom: 1,
  },
  heroMetaValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 6,
  },
  logo: {
    width: 100,
    height: 52,
    objectFit: 'contain',
    marginBottom: 6,
  },
  bizName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    textAlign: 'right',
    marginBottom: 2,
  },
  bizTag: {
    fontSize: 7,
    color: C.muted,
    textAlign: 'right',
    marginBottom: 2,
  },
  bizLine: {
    fontSize: 7,
    color: C.muted,
    textAlign: 'right',
    marginBottom: 1,
  },
  bizGstin: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    textAlign: 'right',
    marginTop: 2,
  },

  // ── Meta strip (place of supply, PO, ref, delivery) ──
  metaStrip: {
    flexDirection: 'row',
    backgroundColor: C.stripGray,
    borderRadius: 6,
    border: `0.5pt solid ${C.border}`,
    padding: 8,
    marginBottom: 10,
  },
  metaField: {
    flex: 1,
    paddingHorizontal: 6,
    borderRight: `0.5pt solid ${C.border}`,
  },
  metaFieldLast: {
    flex: 1,
    paddingHorizontal: 6,
  },
  metaLabel: {
    fontSize: 6,
    color: C.muted,
    marginBottom: 1.5,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
  },

  // ── Party cards ──
  partyRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  partyCard: {
    flex: 1,
    backgroundColor: C.cardBg,
    border: `0.5pt solid ${C.border}`,
    borderRadius: 6,
    padding: 10,
    marginRight: 6,
  },
  partyCardRight: {
    flex: 1,
    backgroundColor: C.cardBg,
    border: `0.5pt solid ${C.border}`,
    borderRadius: 6,
    padding: 10,
  },
  partyHeading: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: C.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  partyName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 2,
  },
  partyGstin: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 7,
    color: C.muted,
    marginBottom: 1,
  },

  // ── Items table ──
  table: {
    border: `0.5pt solid ${C.border}`,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.navy,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${C.border}`,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${C.border}`,
    backgroundColor: C.rowAlt,
  },
  th: {
    color: C.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRight: `0.5pt solid #2D3F55`,
  },
  thLast: {
    color: C.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  td: {
    fontSize: 7,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRight: `0.5pt solid ${C.border}`,
    color: C.dark,
  },
  tdLast: {
    fontSize: 7,
    paddingVertical: 5,
    paddingHorizontal: 4,
    color: C.dark,
  },
  tdItemName: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    marginBottom: 1,
  },
  tdItemDesc: {
    fontSize: 6.5,
    color: C.muted,
  },
  tdTaxLine: {
    fontSize: 6,
    color: C.muted,
    marginTop: 1,
  },

  // column widths
  colSno:   { width: 16 },
  colDesc:  { flex: 1 },
  colHsn:   { width: 40 },
  colQty:   { width: 32 },
  colRate:  { width: 48 },
  colCgst:  { width: 52 },
  colSgst:  { width: 52 },
  colAmt:   { width: 54 },

  // ── Amount in words ──
  wordsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'stretch',
  },
  wordsBox: {
    flex: 1,
    backgroundColor: C.stripGray,
    border: `0.5pt solid ${C.border}`,
    borderRadius: 6,
    padding: 8,
    marginRight: 6,
  },
  wordsLabel: {
    fontSize: 6,
    color: C.muted,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  wordsText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
  },

  // ── Totals box ──
  totalsBox: {
    width: 190,
    border: `0.5pt solid ${C.border}`,
    borderRadius: 6,
    overflow: 'hidden',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  totalsLabel: {
    fontSize: 7,
    color: C.muted,
  },
  totalsValue: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
  },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: C.accentLight,
  },
  grandLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: C.accent,
  },
  grandValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: C.accent,
  },

  // ── Tax summary ──
  taxSection: {
    border: `0.5pt solid ${C.border}`,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  taxTitleBar: {
    backgroundColor: C.stripGray,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  taxTitle: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  taxHeader: {
    flexDirection: 'row',
    backgroundColor: C.taxHeaderBg,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  taxRow: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${C.border}`,
  },
  taxRowLast: {
    flexDirection: 'row',
  },
  taxTh: {
    flex: 1,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: C.muted,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRight: `0.5pt solid ${C.border}`,
  },
  taxThLast: {
    flex: 1,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: C.muted,
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  taxCell: {
    flex: 1,
    fontSize: 7,
    color: C.dark,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRight: `0.5pt solid ${C.border}`,
  },
  taxCellLast: {
    flex: 1,
    fontSize: 7,
    color: C.dark,
    paddingVertical: 3,
    paddingHorizontal: 5,
  },

  // ── Notes ──
  notesBox: {
    backgroundColor: C.stripGray,
    border: `0.5pt solid ${C.border}`,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 6,
    color: C.muted,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  notesText: {
    fontSize: 7.5,
    color: C.dark,
  },

  // ── Footer block ──
  footerBlock: {
    backgroundColor: C.stripGray,
    border: `0.5pt solid ${C.border}`,
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
  },
  footerBankCol: {
    flex: 1,
    paddingRight: 12,
    borderRight: `0.5pt solid ${C.border}`,
  },
  footerSealCol: {
    width: 140,
    paddingLeft: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerSectionLabel: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: C.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  footerBankLine: {
    fontSize: 7,
    color: C.dark,
    marginBottom: 1.5,
  },
  footerBankValue: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
  },
  footerForLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  footerSigLine: {
    borderTop: `0.5pt solid ${C.borderDark}`,
    width: 100,
    marginBottom: 3,
  },
  footerSigText: {
    fontSize: 6.5,
    color: C.muted,
    textAlign: 'center',
  },
  footerNote: {
    borderTop: `0.5pt solid ${C.border}`,
    marginTop: 8,
    paddingTop: 6,
    textAlign: 'center',
  },
  footerNoteText: {
    fontSize: 6.5,
    color: C.muted,
  },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function companyAddress(c: {
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  country?: string | null
}) {
  return [c.address_line_1, c.address_line_2, c.city, c.state, c.pincode, c.country]
    .filter(Boolean)
    .join(', ')
}

function TH({ style, children, last }: { style?: Styles[string]; children: React.ReactNode; last?: boolean }) {
  return <Text style={style ? [last ? S.thLast : S.th, style] : (last ? S.thLast : S.th)}>{children}</Text>
}

function TD({
  style,
  children,
  align = 'left',
  last,
}: {
  style?: Styles[string]
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
  last?: boolean
}) {
  const base = last ? S.tdLast : S.td
  const textAlign = align as Styles[string]['textAlign']
  return (
    <Text style={style ? [base, style, { textAlign }] : [base, { textAlign }]}>
      {children}
    </Text>
  )
}

// ── Header Section ────────────────────────────────────────────────────────────

function HeaderSection({
  invoice,
  logoDataUrl,
}: {
  invoice: InvoiceWithRelations
  logoDataUrl: string | null
}) {
  return (
    <View style={S.hero}>
      {/* Left: Invoice title + meta */}
      <View style={S.heroLeft}>
        <Text style={S.heroTitle}>TAX INVOICE</Text>
        <Text style={S.heroMetaLabel}>Invoice No.</Text>
        <Text style={S.heroMetaValue}>{invoice.invoice_no}</Text>
        <Text style={S.heroMetaLabel}>Invoice Date</Text>
        <Text style={S.heroMetaValue}>{invoice.invoice_date}</Text>
        <Text style={S.heroMetaLabel}>Place of Supply</Text>
        <Text style={S.heroMetaValue}>{invoice.place_of_supply || '—'}</Text>
      </View>

      {/* Right: Logo + Business details */}
      <View style={S.heroRight}>
        {logoDataUrl && <Image style={S.logo} src={logoDataUrl} />}
        <Text style={S.bizName}>{BUSINESS.name}</Text>
        <Text style={S.bizTag}>{BUSINESS.tagline}</Text>
        <Text style={S.bizLine}>
          {BUSINESS.addressLine1}, {BUSINESS.addressLine2}
        </Text>
        <Text style={S.bizLine}>
          {BUSINESS.city}, {BUSINESS.state} – {BUSINESS.pincode}
        </Text>
        <Text style={S.bizLine}>
          {BUSINESS.phone}  ·  {BUSINESS.email}
        </Text>
        <Text style={S.bizGstin}>GSTIN: {BUSINESS.gstin}</Text>
      </View>
    </View>
  )
}

// ── Meta Strip ────────────────────────────────────────────────────────────────

function MetaStrip({ invoice }: { invoice: InvoiceWithRelations }) {
  const fields = [
    { label: 'P.O. Number',   value: invoice.purchase_order_no },
    { label: 'Supplier Ref',  value: invoice.supplier_ref },
    { label: 'Delivery Note', value: invoice.delivery_note },
    { label: 'Other Ref',     value: invoice.other_reference },
  ]
  return (
    <View style={S.metaStrip}>
      {fields.map((f, i) => (
        <View key={f.label} style={i < fields.length - 1 ? S.metaField : S.metaFieldLast}>
          <Text style={S.metaLabel}>{f.label}</Text>
          <Text style={S.metaValue}>{f.value || '—'}</Text>
        </View>
      ))}
    </View>
  )
}

// ── Party Card ────────────────────────────────────────────────────────────────

function PartyCard({
  label,
  company,
  right,
}: {
  label: string
  company: NonNullable<InvoiceWithRelations['bill_to_company']> | null
  right?: boolean
}) {
  return (
    <View style={right ? S.partyCardRight : S.partyCard}>
      <Text style={S.partyHeading}>{label}</Text>
      {company ? (
        <>
          <Text style={S.partyName}>{company.company_name}</Text>
          {company.gstin && <Text style={S.partyGstin}>GSTIN: {company.gstin}</Text>}
          <Text style={S.partyLine}>{companyAddress(company)}</Text>
          {company.phone && <Text style={S.partyLine}>Ph: {company.phone}</Text>}
          {company.email && <Text style={S.partyLine}>{company.email}</Text>}
        </>
      ) : (
        <Text style={S.partyLine}>—</Text>
      )}
    </View>
  )
}

// ── Items Table ───────────────────────────────────────────────────────────────

function ItemsTable({ items }: { items: InvoiceWithRelations['invoice_items'] }) {
  return (
    <View style={S.table}>
      {/* Header */}
      <View style={S.tableHeader}>
        <TH style={S.colSno}>#</TH>
        <TH style={S.colDesc}>Item &amp; Description</TH>
        <TH style={S.colHsn}>HSN/SAC</TH>
        <TH style={S.colQty}>Qty / Unit</TH>
        <TH style={S.colRate}>Rate (₹)</TH>
        <TH style={S.colCgst}>CGST</TH>
        <TH style={S.colSgst}>SGST</TH>
        <TH style={S.colAmt} last>Amount (₹)</TH>
      </View>

      {/* Rows */}
      {items.map((line, i) => {
        const rowStyle = i % 2 === 0 ? S.tableRow : S.tableRowAlt
        const itemName = line.item?.item_name ?? line.description ?? '—'
        const desc = line.item?.item_name ? line.description : null
        return (
          <View key={line.id} style={rowStyle}>
            <TD style={S.colSno} align="center">{i + 1}</TD>

            {/* Description cell: item name bold + description below */}
            <View style={[S.td, S.colDesc]}>
              <Text style={S.tdItemName}>{itemName}</Text>
              {desc && <Text style={S.tdItemDesc}>{desc}</Text>}
            </View>

            <TD style={S.colHsn} align="center">{line.hsn_sac || '—'}</TD>

            <TD style={S.colQty} align="center">
              {line.qty}{line.unit ? ` ${line.unit}` : ''}
            </TD>

            <TD style={S.colRate} align="right">{fmt(line.rate)}</TD>

            {/* CGST cell: percent + amount */}
            <View style={[S.td, S.colCgst]}>
              <Text style={[S.td, { borderRight: 0, padding: 0, fontSize: 7 }]}>
                {line.cgst_percent}%
              </Text>
              <Text style={S.tdTaxLine}>₹ {fmt(line.cgst_amount)}</Text>
            </View>

            {/* SGST cell: percent + amount */}
            <View style={[S.td, S.colSgst]}>
              <Text style={[S.td, { borderRight: 0, padding: 0, fontSize: 7 }]}>
                {line.sgst_percent}%
              </Text>
              <Text style={S.tdTaxLine}>₹ {fmt(line.sgst_amount)}</Text>
            </View>

            <TD style={S.colAmt} align="right" last>{fmt(line.total)}</TD>
          </View>
        )
      })}
    </View>
  )
}

// ── Totals Box ────────────────────────────────────────────────────────────────

function TotalsBox({ invoice }: { invoice: InvoiceWithRelations }) {
  return (
    <View style={S.totalsBox}>
      <View style={S.totalsRow}>
        <Text style={S.totalsLabel}>Subtotal</Text>
        <Text style={S.totalsValue}>₹ {fmt(invoice.subtotal)}</Text>
      </View>
      <View style={S.totalsRow}>
        <Text style={S.totalsLabel}>Total CGST</Text>
        <Text style={S.totalsValue}>₹ {fmt(invoice.total_cgst)}</Text>
      </View>
      <View style={S.totalsRow}>
        <Text style={S.totalsLabel}>Total SGST</Text>
        <Text style={S.totalsValue}>₹ {fmt(invoice.total_sgst)}</Text>
      </View>
      <View style={S.grandRow}>
        <Text style={S.grandLabel}>Grand Total</Text>
        <Text style={S.grandValue}>₹ {fmt(invoice.grand_total)}</Text>
      </View>
    </View>
  )
}

// ── Tax Summary ───────────────────────────────────────────────────────────────

function TaxSummary({ items }: { items: InvoiceWithRelations['invoice_items'] }) {
  return (
    <View style={S.taxSection}>
      <View style={S.taxTitleBar}>
        <Text style={S.taxTitle}>Tax Summary</Text>
      </View>
      <View style={S.taxHeader}>
        <Text style={S.taxTh}>HSN/SAC</Text>
        <Text style={S.taxTh}>Taxable Value (₹)</Text>
        <Text style={S.taxTh}>CGST Rate</Text>
        <Text style={S.taxTh}>CGST Amt (₹)</Text>
        <Text style={S.taxTh}>SGST Rate</Text>
        <Text style={S.taxTh}>SGST Amt (₹)</Text>
        <Text style={S.taxThLast}>Total Tax (₹)</Text>
      </View>
      {items.map((line, i) => {
        const isLast = i === items.length - 1
        const rowStyle = isLast ? S.taxRowLast : S.taxRow
        return (
          <View key={i} style={rowStyle}>
            <Text style={S.taxCell}>{line.hsn_sac || '—'}</Text>
            <Text style={S.taxCell}>{fmt(line.amount)}</Text>
            <Text style={S.taxCell}>{line.cgst_percent}%</Text>
            <Text style={S.taxCell}>{fmt(line.cgst_amount)}</Text>
            <Text style={S.taxCell}>{line.sgst_percent}%</Text>
            <Text style={S.taxCell}>{fmt(line.sgst_amount)}</Text>
            <Text style={S.taxCellLast}>{fmt(line.sgst_amount + line.cgst_amount)}</Text>
          </View>
        )
      })}
    </View>
  )
}

// ── Footer Section ────────────────────────────────────────────────────────────

function FooterSection({ invoice }: { invoice: InvoiceWithRelations }) {
  const paymentText = invoice.payment_details ||
    `Account Name: ${BUSINESS.bank.accountName}\nBank: ${BUSINESS.bank.bankName}\nAccount No.: ${BUSINESS.bank.accountNo}\nIFSC: ${BUSINESS.bank.ifsc}\nBranch: ${BUSINESS.bank.branch}`

  const bankLines = paymentText.split('\n').filter(Boolean)

  return (
    <View style={S.footerBlock}>
      <View style={S.footerRow}>
        {/* Bank details */}
        <View style={S.footerBankCol}>
          <Text style={S.footerSectionLabel}>Bank / Payment Details</Text>
          {bankLines.map((line, i) => (
            <Text key={i} style={S.footerBankLine}>{line}</Text>
          ))}
        </View>

        {/* Authorised signatory */}
        <View style={S.footerSealCol}>
          <Text style={S.footerForLabel}>For {BUSINESS.name}</Text>
          <View>
            <View style={S.footerSigLine} />
            <Text style={S.footerSigText}>
              {invoice.common_seal_text || 'Authorised Signatory'}
            </Text>
          </View>
        </View>
      </View>

      {/* Computer generated note */}
      <View style={S.footerNote}>
        <Text style={S.footerNoteText}>{BUSINESS.defaultFooterNote}</Text>
      </View>
    </View>
  )
}

// ── Main PDF component ────────────────────────────────────────────────────────

export function InvoicePDF({
  invoice,
  logoDataUrl,
}: {
  invoice: InvoiceWithRelations
  logoDataUrl: string | null
}) {
  const bill  = invoice.bill_to_company
  const ship  = invoice.ship_to_company
  const items = invoice.invoice_items ?? []

  return (
    <Document title={`Invoice ${invoice.invoice_no}`}>
      <Page size="A4" style={S.page}>

        {/* ── Hero header ── */}
        <HeaderSection invoice={invoice} logoDataUrl={logoDataUrl} />

        {/* ── Meta strip (PO, ref, delivery) ── */}
        <MetaStrip invoice={invoice} />

        {/* ── Bill To / Ship To ── */}
        <View style={S.partyRow}>
          <PartyCard label="Bill To" company={bill} />
          <PartyCard
            label="Ship To"
            company={ship ?? bill}
            right
          />
        </View>

        {/* ── Items table ── */}
        <ItemsTable items={items} />

        {/* ── Amount in words + Totals ── */}
        <View style={S.wordsRow}>
          <View style={S.wordsBox}>
            <Text style={S.wordsLabel}>Total In Words</Text>
            <Text style={S.wordsText}>
              {invoice.amount_in_words || '—'}
            </Text>
            {invoice.notes ? (
              <>
                <Text style={[S.wordsLabel, { marginTop: 8 }]}>Notes</Text>
                <Text style={S.notesText}>{invoice.notes}</Text>
              </>
            ) : null}
          </View>
          <TotalsBox invoice={invoice} />
        </View>

        {/* ── Tax summary ── */}
        <TaxSummary items={items} />

        {/* ── Terms ── */}
        <View style={S.notesBox}>
          <Text style={S.notesLabel}>Terms &amp; Conditions</Text>
          <Text style={S.notesText}>{BUSINESS.defaultTerms}</Text>
        </View>

        {/* ── Footer: bank + signatory ── */}
        <FooterSection invoice={invoice} />

      </Page>
    </Document>
  )
}
