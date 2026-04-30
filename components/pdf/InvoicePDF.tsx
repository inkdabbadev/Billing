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

// ── Styles ────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#1a1a1a',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    backgroundColor: '#fff',
  },
  outerBorder: {
    border: '1pt solid #333',
    flex: 1,
    padding: 12,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1pt solid #333',
  },
  logo: { width: 60, height: 60, objectFit: 'contain', marginRight: 12 },
  headerText: { flex: 1 },
  businessName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#111' },
  businessSub: { fontSize: 7, color: '#555', marginTop: 2 },

  // ── Title bar ──
  titleBar: {
    backgroundColor: '#1a1a1a',
    textAlign: 'center',
    paddingVertical: 5,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#fff',
    letterSpacing: 3,
  },

  // ── Two-column meta ──
  metaRow: { flexDirection: 'row', marginBottom: 8 },
  metaCol: { flex: 1 },
  metaBox: {
    border: '0.5pt solid #bbb',
    padding: 5,
    marginRight: 4,
  },
  metaBoxRight: { border: '0.5pt solid #bbb', padding: 5 },
  metaLabel: { fontSize: 6.5, color: '#777', marginBottom: 1 },
  metaValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold' },

  // ── Bill/Ship to ──
  partyRow: { flexDirection: 'row', marginBottom: 8 },
  partyBox: {
    flex: 1,
    border: '0.5pt solid #bbb',
    padding: 6,
    marginRight: 4,
  },
  partyBoxRight: { flex: 1, border: '0.5pt solid #bbb', padding: 6 },
  partyTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#555',
    textTransform: 'uppercase',
  },
  partyName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  partyLine: { fontSize: 7, color: '#333', marginBottom: 1 },

  // ── Table ──
  table: { border: '0.5pt solid #bbb', marginBottom: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a1a1a' },
  tableRow: { flexDirection: 'row', borderBottom: '0.5pt solid #ddd' },
  tableRowAlt: { flexDirection: 'row', borderBottom: '0.5pt solid #ddd', backgroundColor: '#f9f9f9' },
  th: {
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    padding: 4,
    borderRight: '0.5pt solid #555',
  },
  td: {
    fontSize: 7,
    padding: 4,
    borderRight: '0.5pt solid #ddd',
    color: '#1a1a1a',
  },

  // column widths
  colSno:    { width: 24 },
  colDesc:   { flex: 2 },
  colHsn:    { width: 44 },
  colQty:    { width: 28 },
  colUnit:   { width: 28 },
  colRate:   { width: 42 },
  colAmt:    { width: 46 },
  colSgstP:  { width: 28 },
  colSgstA:  { width: 42 },
  colCgstP:  { width: 28 },
  colCgstA:  { width: 42 },
  colTotal:  { width: 50 },
  colTotalLast: { width: 50, borderRight: 0 },

  // ── Totals / summary ──
  summaryRow: { flexDirection: 'row' },
  wordsBox: {
    flex: 2,
    border: '0.5pt solid #bbb',
    padding: 6,
    marginRight: 4,
  },
  totalsBox: {
    width: 180,
    border: '0.5pt solid #bbb',
    padding: 6,
  },
  totalsLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  totalsLabel: { fontSize: 7, color: '#444' },
  totalsValue: { fontSize: 7, fontFamily: 'Helvetica-Bold' },
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '0.5pt solid #333',
    paddingTop: 3,
    marginTop: 3,
  },
  grandLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  grandValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // ── Tax summary ──
  taxSection: { marginTop: 8, border: '0.5pt solid #bbb', padding: 6 },
  taxTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  taxHeader: { flexDirection: 'row', borderBottom: '0.5pt solid #bbb', paddingBottom: 2, marginBottom: 2 },
  taxCol: { flex: 1, fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#555' },
  taxRow: { flexDirection: 'row' },
  taxCell: { flex: 1, fontSize: 7 },

  // ── Bank details ──
  bankSection: {
    marginTop: 8,
    flexDirection: 'row',
    border: '0.5pt solid #bbb',
    padding: 6,
  },
  bankCol: { flex: 1 },
  bankTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#555', textTransform: 'uppercase' },
  bankLine: { fontSize: 7, marginBottom: 2 },
  sealCol: {
    width: 130,
    borderLeft: '0.5pt solid #bbb',
    paddingLeft: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sealLabel: { fontSize: 7, color: '#555', marginBottom: 20 },
  sealLine: { borderTop: '0.5pt solid #555', width: 100, marginBottom: 3 },
  sealText: { fontSize: 6.5, color: '#777' },

  // ── Footer ──
  footer: { marginTop: 10, textAlign: 'center', borderTop: '0.5pt solid #bbb', paddingTop: 5 },
  footerText: { fontSize: 6.5, color: '#888' },
})

// ── Helper: address string ────────────────────────────────────────────────────

function companyAddress(c: { address_line_1?: string | null; address_line_2?: string | null; city?: string | null; state?: string | null; pincode?: string | null; country?: string | null }) {
  return [c.address_line_1, c.address_line_2, c.city, c.state, c.pincode, c.country]
    .filter(Boolean)
    .join(', ')
}

// ── Meta field ───────────────────────────────────────────────────────────────

function MetaField({ label, value, right }: { label: string; value?: string | null; right?: boolean }) {
  return (
    <View style={right ? S.metaBoxRight : S.metaBox}>
      <Text style={S.metaLabel}>{label}</Text>
      <Text style={S.metaValue}>{value || '—'}</Text>
    </View>
  )
}

// ── Table header cell ─────────────────────────────────────────────────────────

function TH({ style, children }: { style?: Styles[string]; children: React.ReactNode }) {
  return <Text style={style ? [S.th, style] : S.th}>{children}</Text>
}

// ── Table data cell ───────────────────────────────────────────────────────────

function TD({
  style,
  children,
  align = 'left',
}: {
  style?: Styles[string]
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
}) {
  const textAlign = align as Styles[string]['textAlign']
  return (
    <Text style={style ? [S.td, style, { textAlign }] : [S.td, { textAlign }]}>{children}</Text>
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
  const bill = invoice.bill_to_company
  const ship = invoice.ship_to_company
  const items = invoice.invoice_items ?? []

  return (
    <Document title={`Invoice ${invoice.invoice_no}`}>
      <Page size="A4" orientation="landscape" style={S.page}>
        <View style={S.outerBorder}>

          {/* ── Header ── */}
          <View style={S.header}>
            {logoDataUrl && <Image style={S.logo} src={logoDataUrl} />}
            <View style={S.headerText}>
              <Text style={S.businessName}>{BUSINESS.name}</Text>
              <Text style={S.businessSub}>{BUSINESS.tagline}</Text>
              <Text style={S.businessSub}>
                {BUSINESS.addressLine1}, {BUSINESS.addressLine2}, {BUSINESS.city} – {BUSINESS.pincode}
              </Text>
              <Text style={S.businessSub}>
                Phone: {BUSINESS.phone}  |  Email: {BUSINESS.email}  |  GSTIN: {BUSINESS.gstin}
              </Text>
            </View>
          </View>

          {/* ── Title ── */}
          <View style={S.titleBar}>
            <Text style={S.titleText}>TAX INVOICE</Text>
          </View>

          {/* ── Invoice meta two-column ── */}
          <View style={S.metaRow}>
            <View style={[S.metaCol, { flexDirection: 'row', flex: 1, marginRight: 4 }]}>
              <MetaField label="Invoice No." value={invoice.invoice_no} />
              <MetaField label="Invoice Date" value={invoice.invoice_date} />
              <MetaField label="Place of Supply" value={invoice.place_of_supply} />
            </View>
            <View style={[S.metaCol, { flexDirection: 'row', flex: 1 }]}>
              <MetaField label="P.O. Number" value={invoice.purchase_order_no} />
              <MetaField label="Supplier Ref" value={invoice.supplier_ref} />
              <MetaField label="Delivery Note" value={invoice.delivery_note} right />
            </View>
          </View>

          {/* ── Bill To / Ship To ── */}
          <View style={S.partyRow}>
            <View style={S.partyBox}>
              <Text style={S.partyTitle}>Bill To</Text>
              {bill ? (
                <>
                  <Text style={S.partyName}>{bill.company_name}</Text>
                  {bill.gstin && <Text style={S.partyLine}>GSTIN: {bill.gstin}</Text>}
                  <Text style={S.partyLine}>{companyAddress(bill)}</Text>
                  {bill.phone && <Text style={S.partyLine}>Ph: {bill.phone}</Text>}
                  {bill.email && <Text style={S.partyLine}>{bill.email}</Text>}
                </>
              ) : <Text style={S.partyLine}>—</Text>}
            </View>
            <View style={S.partyBoxRight}>
              <Text style={S.partyTitle}>Ship To</Text>
              {ship ? (
                <>
                  <Text style={S.partyName}>{ship.company_name}</Text>
                  {ship.gstin && <Text style={S.partyLine}>GSTIN: {ship.gstin}</Text>}
                  <Text style={S.partyLine}>{companyAddress(ship)}</Text>
                  {ship.phone && <Text style={S.partyLine}>Ph: {ship.phone}</Text>}
                </>
              ) : bill ? (
                <>
                  <Text style={S.partyName}>{bill.company_name}</Text>
                  <Text style={S.partyLine}>{companyAddress(bill)}</Text>
                </>
              ) : <Text style={S.partyLine}>Same as Bill To</Text>}
            </View>
          </View>

          {/* ── Items Table ── */}
          <View style={S.table}>
            <View style={S.tableHeader}>
              <TH style={S.colSno}>#</TH>
              <TH style={S.colDesc}>Description of Goods / Service</TH>
              <TH style={S.colHsn}>HSN/SAC</TH>
              <TH style={S.colQty}>Qty</TH>
              <TH style={S.colUnit}>Unit</TH>
              <TH style={S.colRate}>Rate (₹)</TH>
              <TH style={S.colAmt}>Amount (₹)</TH>
              <TH style={S.colSgstP}>SGST%</TH>
              <TH style={S.colSgstA}>SGST (₹)</TH>
              <TH style={S.colCgstP}>CGST%</TH>
              <TH style={S.colCgstA}>CGST (₹)</TH>
              <TH style={S.colTotalLast}>Total (₹)</TH>
            </View>

            {items.map((line, i) => {
              const RowStyle = i % 2 === 0 ? S.tableRow : S.tableRowAlt
              return (
                <View key={line.id} style={RowStyle}>
                  <TD style={S.colSno} align="center">{i + 1}</TD>
                  <TD style={S.colDesc}>{line.description}</TD>
                  <TD style={S.colHsn} align="center">{line.hsn_sac || '—'}</TD>
                  <TD style={S.colQty} align="right">{line.qty}</TD>
                  <TD style={S.colUnit} align="center">{line.unit}</TD>
                  <TD style={S.colRate} align="right">{fmt(line.rate)}</TD>
                  <TD style={S.colAmt} align="right">{fmt(line.amount)}</TD>
                  <TD style={S.colSgstP} align="right">{line.sgst_percent}%</TD>
                  <TD style={S.colSgstA} align="right">{fmt(line.sgst_amount)}</TD>
                  <TD style={S.colCgstP} align="right">{line.cgst_percent}%</TD>
                  <TD style={S.colCgstA} align="right">{fmt(line.cgst_amount)}</TD>
                  <TD style={S.colTotalLast} align="right">
                    {fmt(line.total)}
                  </TD>
                </View>
              )
            })}
          </View>

          {/* ── Amount in words + totals ── */}
          <View style={S.summaryRow}>
            <View style={S.wordsBox}>
              <Text style={[S.partyTitle, { marginBottom: 4 }]}>Amount in Words</Text>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>
                {invoice.amount_in_words}
              </Text>
              {invoice.notes ? (
                <Text style={{ fontSize: 7, marginTop: 6, color: '#555' }}>
                  Notes: {invoice.notes}
                </Text>
              ) : null}
            </View>
            <View style={S.totalsBox}>
              <View style={S.totalsLine}>
                <Text style={S.totalsLabel}>Subtotal</Text>
                <Text style={S.totalsValue}>₹ {fmt(invoice.subtotal)}</Text>
              </View>
              <View style={S.totalsLine}>
                <Text style={S.totalsLabel}>Total SGST</Text>
                <Text style={S.totalsValue}>₹ {fmt(invoice.total_sgst)}</Text>
              </View>
              <View style={S.totalsLine}>
                <Text style={S.totalsLabel}>Total CGST</Text>
                <Text style={S.totalsValue}>₹ {fmt(invoice.total_cgst)}</Text>
              </View>
              <View style={S.grandTotalLine}>
                <Text style={S.grandLabel}>Grand Total</Text>
                <Text style={S.grandValue}>₹ {fmt(invoice.grand_total)}</Text>
              </View>
            </View>
          </View>

          {/* ── Tax summary ── */}
          <View style={S.taxSection}>
            <Text style={S.taxTitle}>Tax Summary</Text>
            <View style={S.taxHeader}>
              <Text style={S.taxCol}>HSN/SAC</Text>
              <Text style={S.taxCol}>Taxable Value (₹)</Text>
              <Text style={S.taxCol}>SGST Rate</Text>
              <Text style={S.taxCol}>SGST Amt (₹)</Text>
              <Text style={S.taxCol}>CGST Rate</Text>
              <Text style={S.taxCol}>CGST Amt (₹)</Text>
              <Text style={S.taxCol}>Total Tax (₹)</Text>
            </View>
            {items.map((line, i) => (
              <View key={i} style={S.taxRow}>
                <Text style={S.taxCell}>{line.hsn_sac || '—'}</Text>
                <Text style={S.taxCell}>{fmt(line.amount)}</Text>
                <Text style={S.taxCell}>{line.sgst_percent}%</Text>
                <Text style={S.taxCell}>{fmt(line.sgst_amount)}</Text>
                <Text style={S.taxCell}>{line.cgst_percent}%</Text>
                <Text style={S.taxCell}>{fmt(line.cgst_amount)}</Text>
                <Text style={S.taxCell}>{fmt(line.sgst_amount + line.cgst_amount)}</Text>
              </View>
            ))}
          </View>

          {/* ── Bank Details + Common Seal ── */}
          <View style={S.bankSection}>
            <View style={S.bankCol}>
              <Text style={S.bankTitle}>Bank / Payment Details</Text>
              <Text style={S.bankLine}>
                {invoice.payment_details ||
                  `Account Name: ${BUSINESS.bank.accountName}\nBank: ${BUSINESS.bank.bankName}\nAccount No.: ${BUSINESS.bank.accountNo}\nIFSC: ${BUSINESS.bank.ifsc}\nBranch: ${BUSINESS.bank.branch}`}
              </Text>
            </View>
            <View style={S.sealCol}>
              <Text style={S.sealLabel}>For {BUSINESS.name}</Text>
              <Text style={S.sealText}>
                {invoice.common_seal_text || 'Authorised Signatory'}
              </Text>
              <View style={S.sealLine} />
              <Text style={S.sealText}>Common Seal / Signature</Text>
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={S.footer}>
            <Text style={S.footerText}>{BUSINESS.defaultFooterNote}</Text>
          </View>

        </View>
      </Page>
    </Document>
  )
}
