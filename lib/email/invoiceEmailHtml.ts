import type { CompanyConfig } from '@/lib/config/companies'
import type { InvoiceWithRelations } from '@/lib/types/invoice'
import type { Company } from '@/lib/types/database'

function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatAddress(c: Company | null): string {
  if (!c) return ''
  return [c.address_line_1, c.address_line_2, c.city, c.state, c.pincode]
    .filter(Boolean)
    .map(esc)
    .join(', ')
}


function statusChipLight(status: string): string {
  const map: Record<string, { bg: string; fg: string }> = {
    paid:   { bg: '#D1FAE5', fg: '#065F46' },
    unpaid: { bg: '#FEF3C7', fg: '#92400E' },
    draft:  { bg: '#F3F4F6', fg: '#374151' },
  }
  const c = map[status] ?? map.draft
  return `<span style="background:${c.bg};color:${c.fg};font-size:10px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;display:inline-block;">${esc(status)}</span>`
}

// ── INK DABBA ─────────────────────────────────────────────────────────────────
// Light pink, creative — screen printing & branding studio
function inkDabbaHtml(invoice: InvoiceWithRelations, config: CompanyConfig): string {
  const bill = invoice.bill_to_company
  const address = formatAddress(bill)
  const items = invoice.invoice_items ?? []

  const itemRows = items.map((item, i) => `
    <tr bgcolor="${i % 2 === 0 ? '#FFFFFF' : '#FFF5FB'}">
      <td style="padding:12px 14px;font-size:13px;color:#111111;line-height:1.4;border-bottom:1px solid #FCE7F3;">
        ${esc(item.description)}
        ${item.hsn_sac ? `<br><span style="font-size:9px;color:#9CA3AF;font-family:'Courier New',monospace;">HSN: ${esc(item.hsn_sac)}</span>` : ''}
      </td>
      <td style="padding:12px 14px;font-size:12px;color:#6B7280;text-align:center;white-space:nowrap;border-bottom:1px solid #FCE7F3;">${item.qty} ${esc(item.unit ?? '')}</td>
      <td style="padding:12px 14px;font-size:12px;color:#6B7280;text-align:right;white-space:nowrap;border-bottom:1px solid #FCE7F3;">₹ ${fmt(item.rate)}</td>
      <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#111111;text-align:right;white-space:nowrap;border-bottom:1px solid #FCE7F3;">₹ ${fmt(item.total)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Invoice ${esc(invoice.invoice_no)} — INK DABBA</title>
</head>
<body style="margin:0;padding:0;background:#FFF0F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFF0F8">
  <tr><td align="center" style="padding:36px 16px;">

    <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0"
           style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;border-top:4px solid #E6007E;">

      <!-- ── HEADER ── -->
      <tr>
        <td style="padding:32px 36px 24px;border-bottom:1px solid #FCE7F3;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle">
                <img src="cid:company-logo" alt="INK DABBA" width="46" height="46"
                     style="display:block;border-radius:10px;object-fit:contain;">
              </td>
              <td valign="middle" style="padding-left:14px;">
                <p style="margin:0;font-size:20px;font-weight:800;color:#111111;letter-spacing:-0.5px;">INK DABBA</p>
                <p style="margin:3px 0 0;font-size:11px;color:#6B7280;letter-spacing:0.5px;">Screen Printing &amp; Branding Studio</p>
              </td>
              <td align="right" valign="middle">
                <div style="background:#FFF0F8;padding:12px 22px;border-radius:10px;display:inline-block;border-left:3px solid #E6007E;">
                  <p style="margin:0;font-size:22px;font-weight:900;color:#E6007E;letter-spacing:-1px;">INVOICE</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#C9006F;font-weight:600;letter-spacing:0.5px;">#${esc(invoice.invoice_no)}</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── META: date + status ── -->
      <tr>
        <td bgcolor="#FFF5FB" style="padding:12px 36px;border-bottom:1px solid #FCE7F3;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td><p style="margin:0;font-size:12px;color:#6B7280;">Invoice Date: <strong style="color:#111111;">${esc(invoice.invoice_date)}</strong></p></td>
              <td align="right">${statusChipLight(invoice.status)}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── BILL TO + INVOICE INFO ── -->
      <tr>
        <td style="padding:28px 36px;border-bottom:1px solid #FCE7F3;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" valign="top" style="padding-right:24px;">
                <p style="margin:0 0 10px;font-size:9px;font-weight:700;letter-spacing:2px;color:#E6007E;text-transform:uppercase;">Bill To</p>
                <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#111111;line-height:1.2;">${esc(bill?.company_name ?? '—')}</p>
                ${bill?.gstin ? `<p style="margin:0 0 4px;font-size:10px;color:#9CA3AF;font-family:'Courier New',monospace;">GSTIN: ${esc(bill.gstin)}</p>` : ''}
                ${address ? `<p style="margin:6px 0 0;font-size:12px;color:#555;line-height:1.7;">${address}</p>` : ''}
                ${bill?.phone ? `<p style="margin:4px 0 0;font-size:12px;color:#6B7280;">${esc(bill.phone)}</p>` : ''}
                ${bill?.email ? `<p style="margin:2px 0 0;font-size:12px;color:#6B7280;">${esc(bill.email)}</p>` : ''}
              </td>
              <td width="50%" valign="top" style="padding-left:24px;border-left:1px solid #FCE7F3;">
                <p style="margin:0 0 10px;font-size:9px;font-weight:700;letter-spacing:2px;color:#E6007E;text-transform:uppercase;">Invoice Info</p>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:12px;color:#9CA3AF;padding:3px 24px 3px 0;white-space:nowrap;">Invoice No.</td>
                    <td style="font-size:12px;color:#111111;font-weight:600;padding:3px 0;">${esc(invoice.invoice_no)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#9CA3AF;padding:3px 24px 3px 0;">Invoice Date</td>
                    <td style="font-size:12px;color:#111111;font-weight:600;padding:3px 0;">${esc(invoice.invoice_date)}</td>
                  </tr>
                  ${invoice.place_of_supply ? `<tr>
                    <td style="font-size:12px;color:#9CA3AF;padding:3px 24px 3px 0;white-space:nowrap;">Place of Supply</td>
                    <td style="font-size:12px;color:#111111;font-weight:600;padding:3px 0;">${esc(invoice.place_of_supply)}</td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── ITEMS ── -->
      <tr>
        <td style="padding:0 36px 4px;">
          <p style="margin:24px 0 14px;font-size:9px;font-weight:700;letter-spacing:2px;color:#E6007E;text-transform:uppercase;">Items &amp; Services</p>
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr bgcolor="#FFF0F8">
              <th style="text-align:left;padding:10px 14px;font-size:9px;font-weight:700;color:#E6007E;letter-spacing:1px;text-transform:uppercase;">Description</th>
              <th style="text-align:center;padding:10px 14px;font-size:9px;font-weight:700;color:#E6007E;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">Qty</th>
              <th style="text-align:right;padding:10px 14px;font-size:9px;font-weight:700;color:#E6007E;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">Rate</th>
              <th style="text-align:right;padding:10px 14px;font-size:9px;font-weight:700;color:#E6007E;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">Total</th>
            </tr>
            ${itemRows}
          </table>
        </td>
      </tr>

      <!-- ── TOTALS ── -->
      <tr>
        <td style="padding:0 36px 32px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr><td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right">
                <tr>
                  <td style="font-size:12px;color:#9CA3AF;padding:3px 36px 3px 0;white-space:nowrap;">Subtotal</td>
                  <td style="font-size:12px;color:#333;padding:3px 0;text-align:right;">₹ ${fmt(invoice.subtotal)}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#9CA3AF;padding:3px 36px 3px 0;">SGST</td>
                  <td style="font-size:12px;color:#333;padding:3px 0;text-align:right;">₹ ${fmt(invoice.total_sgst)}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#9CA3AF;padding:3px 36px 3px 0;">CGST</td>
                  <td style="font-size:12px;color:#333;padding:3px 0;text-align:right;">₹ ${fmt(invoice.total_cgst)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #FCE7F3;margin:0;"></td>
                </tr>
                <tr>
                  <td style="font-size:17px;font-weight:900;color:#E6007E;padding:4px 36px 4px 0;white-space:nowrap;">Grand Total</td>
                  <td style="font-size:17px;font-weight:900;color:#E6007E;padding:4px 0;text-align:right;white-space:nowrap;">₹ ${fmt(invoice.grand_total)}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td>
      </tr>

      ${invoice.amount_in_words ? `
      <tr>
        <td style="padding:14px 36px;border-top:1px solid #FCE7F3;">
          <p style="margin:0 0 4px;font-size:9px;color:#9CA3AF;letter-spacing:2px;text-transform:uppercase;">Amount in Words</p>
          <p style="margin:0;font-size:13px;color:#555;font-style:italic;">${esc(invoice.amount_in_words)}</p>
        </td>
      </tr>` : ''}

      ${invoice.notes ? `
      <tr>
        <td style="padding:14px 36px;border-top:1px solid #FCE7F3;">
          <p style="margin:0 0 6px;font-size:9px;color:#9CA3AF;letter-spacing:2px;text-transform:uppercase;">Notes</p>
          <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">${esc(invoice.notes)}</p>
        </td>
      </tr>` : ''}

      <!-- ── PDF NOTICE ── -->
      <tr>
        <td bgcolor="#FFF5FB" style="padding:16px 36px;border-top:1px solid #FCE7F3;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;">&#128206; The invoice PDF is attached to this email.</p>
        </td>
      </tr>

      <!-- ── FOOTER ── -->
      <tr>
        <td bgcolor="#FFF0F8" style="padding:20px 36px;border-top:3px solid #E6007E;">
          <p style="margin:0 0 4px;font-size:12px;color:#6B7280;">
            <strong style="color:#111111;">${esc(config.pdf.name)}</strong>
            &nbsp;&middot;&nbsp;${esc(config.pdf.email)}
            &nbsp;&middot;&nbsp;${esc(config.pdf.phone)}
          </p>
          ${config.pdf.gstin ? `<p style="margin:4px 0 0;font-size:10px;color:#9CA3AF;font-family:'Courier New',monospace;">GSTIN: ${esc(config.pdf.gstin)}</p>` : ''}
          <p style="margin:8px 0 0;font-size:10px;color:#9CA3AF;">${esc(config.pdf.defaultFooterNote)}</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── ETC ────────────────────────────────────────────────────────────────────────
// Light, professional, corporate — electronics trading company
function etcHtml(invoice: InvoiceWithRelations, config: CompanyConfig): string {
  const bill = invoice.bill_to_company
  const address = formatAddress(bill)
  const items = invoice.invoice_items ?? []

  const itemRows = items.map((item, i) => `
    <tr bgcolor="${i % 2 === 0 ? '#FFFFFF' : '#F7FBF9'}">
      <td style="padding:12px 14px;font-size:13px;color:#1A1A1A;line-height:1.4;border-bottom:1px solid #EAF5EF;">
        ${esc(item.description)}
        ${item.hsn_sac ? `<br><span style="font-size:9px;color:#9CA3AF;font-family:'Courier New',monospace;">HSN: ${esc(item.hsn_sac)}</span>` : ''}
      </td>
      <td style="padding:12px 14px;font-size:12px;color:#6B7280;text-align:center;white-space:nowrap;border-bottom:1px solid #EAF5EF;">${item.qty} ${esc(item.unit ?? '')}</td>
      <td style="padding:12px 14px;font-size:12px;color:#6B7280;text-align:right;white-space:nowrap;border-bottom:1px solid #EAF5EF;">₹ ${fmt(item.rate)}</td>
      <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#0B0F0D;text-align:right;white-space:nowrap;border-bottom:1px solid #EAF5EF;">₹ ${fmt(item.total)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Invoice ${esc(invoice.invoice_no)} — ETC</title>
</head>
<body style="margin:0;padding:0;background:#F0FAF6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F0FAF6">
  <tr><td align="center" style="padding:36px 16px;">

    <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0"
           style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;border-top:4px solid #008C5A;">

      <!-- ── HEADER ── -->
      <tr>
        <td style="padding:32px 36px 24px;border-bottom:1px solid #E8F7F0;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle">
                <img src="cid:company-logo" alt="ETC" width="46" height="46"
                     style="display:block;border-radius:10px;object-fit:contain;">
              </td>
              <td valign="middle" style="padding-left:14px;">
                <p style="margin:0;font-size:20px;font-weight:800;color:#0B0F0D;letter-spacing:-0.5px;">ETC</p>
                <p style="margin:3px 0 0;font-size:11px;color:#6B7280;letter-spacing:0.5px;">Electronics &amp; Technology Company</p>
              </td>
              <td align="right" valign="middle">
                <div style="background:#E8F7F0;padding:12px 22px;border-radius:10px;display:inline-block;border-left:3px solid #008C5A;">
                  <p style="margin:0;font-size:22px;font-weight:900;color:#008C5A;letter-spacing:-1px;">INVOICE</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#00724A;font-weight:600;letter-spacing:0.5px;">#${esc(invoice.invoice_no)}</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── META: date + status ── -->
      <tr>
        <td bgcolor="#F7FBF9" style="padding:12px 36px;border-bottom:1px solid #E8F7F0;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td><p style="margin:0;font-size:12px;color:#6B7280;">Invoice Date: <strong style="color:#0B0F0D;">${esc(invoice.invoice_date)}</strong></p></td>
              <td align="right">${statusChipLight(invoice.status)}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── BILL TO + INVOICE INFO ── -->
      <tr>
        <td style="padding:28px 36px;border-bottom:1px solid #E8F7F0;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" valign="top" style="padding-right:24px;">
                <p style="margin:0 0 10px;font-size:9px;font-weight:700;letter-spacing:2px;color:#008C5A;text-transform:uppercase;">Bill To</p>
                <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#0B0F0D;line-height:1.2;">${esc(bill?.company_name ?? '—')}</p>
                ${bill?.gstin ? `<p style="margin:0 0 4px;font-size:10px;color:#9CA3AF;font-family:'Courier New',monospace;">GSTIN: ${esc(bill.gstin)}</p>` : ''}
                ${address ? `<p style="margin:6px 0 0;font-size:12px;color:#555;line-height:1.7;">${address}</p>` : ''}
                ${bill?.phone ? `<p style="margin:4px 0 0;font-size:12px;color:#6B7280;">${esc(bill.phone)}</p>` : ''}
                ${bill?.email ? `<p style="margin:2px 0 0;font-size:12px;color:#6B7280;">${esc(bill.email)}</p>` : ''}
              </td>
              <td width="50%" valign="top" style="padding-left:24px;border-left:1px solid #E8F7F0;">
                <p style="margin:0 0 10px;font-size:9px;font-weight:700;letter-spacing:2px;color:#008C5A;text-transform:uppercase;">Invoice Info</p>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:12px;color:#9CA3AF;padding:3px 24px 3px 0;white-space:nowrap;">Invoice No.</td>
                    <td style="font-size:12px;color:#0B0F0D;font-weight:600;padding:3px 0;">${esc(invoice.invoice_no)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#9CA3AF;padding:3px 24px 3px 0;">Invoice Date</td>
                    <td style="font-size:12px;color:#0B0F0D;font-weight:600;padding:3px 0;">${esc(invoice.invoice_date)}</td>
                  </tr>
                  ${invoice.place_of_supply ? `<tr>
                    <td style="font-size:12px;color:#9CA3AF;padding:3px 24px 3px 0;white-space:nowrap;">Place of Supply</td>
                    <td style="font-size:12px;color:#0B0F0D;font-weight:600;padding:3px 0;">${esc(invoice.place_of_supply)}</td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── ITEMS ── -->
      <tr>
        <td style="padding:0 36px 4px;">
          <p style="margin:24px 0 14px;font-size:9px;font-weight:700;letter-spacing:2px;color:#008C5A;text-transform:uppercase;">Items &amp; Services</p>
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr bgcolor="#E8F7F0">
              <th style="text-align:left;padding:10px 14px;font-size:9px;font-weight:700;color:#008C5A;letter-spacing:1px;text-transform:uppercase;">Description</th>
              <th style="text-align:center;padding:10px 14px;font-size:9px;font-weight:700;color:#008C5A;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">Qty</th>
              <th style="text-align:right;padding:10px 14px;font-size:9px;font-weight:700;color:#008C5A;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">Rate</th>
              <th style="text-align:right;padding:10px 14px;font-size:9px;font-weight:700;color:#008C5A;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">Total</th>
            </tr>
            ${itemRows}
          </table>
        </td>
      </tr>

      <!-- ── TOTALS ── -->
      <tr>
        <td style="padding:0 36px 32px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr><td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right">
                <tr>
                  <td style="font-size:12px;color:#9CA3AF;padding:3px 36px 3px 0;white-space:nowrap;">Subtotal</td>
                  <td style="font-size:12px;color:#333;padding:3px 0;text-align:right;">₹ ${fmt(invoice.subtotal)}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#9CA3AF;padding:3px 36px 3px 0;">SGST</td>
                  <td style="font-size:12px;color:#333;padding:3px 0;text-align:right;">₹ ${fmt(invoice.total_sgst)}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#9CA3AF;padding:3px 36px 3px 0;">CGST</td>
                  <td style="font-size:12px;color:#333;padding:3px 0;text-align:right;">₹ ${fmt(invoice.total_cgst)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #DDE7E2;margin:0;"></td>
                </tr>
                <tr>
                  <td style="font-size:17px;font-weight:900;color:#008C5A;padding:4px 36px 4px 0;white-space:nowrap;">Grand Total</td>
                  <td style="font-size:17px;font-weight:900;color:#008C5A;padding:4px 0;text-align:right;white-space:nowrap;">₹ ${fmt(invoice.grand_total)}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td>
      </tr>

      ${invoice.amount_in_words ? `
      <tr>
        <td style="padding:14px 36px;border-top:1px solid #E8F7F0;">
          <p style="margin:0 0 4px;font-size:9px;color:#9CA3AF;letter-spacing:2px;text-transform:uppercase;">Amount in Words</p>
          <p style="margin:0;font-size:13px;color:#555;font-style:italic;">${esc(invoice.amount_in_words)}</p>
        </td>
      </tr>` : ''}

      ${invoice.notes ? `
      <tr>
        <td style="padding:14px 36px;border-top:1px solid #E8F7F0;">
          <p style="margin:0 0 6px;font-size:9px;color:#9CA3AF;letter-spacing:2px;text-transform:uppercase;">Notes</p>
          <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">${esc(invoice.notes)}</p>
        </td>
      </tr>` : ''}

      <!-- ── PDF NOTICE ── -->
      <tr>
        <td bgcolor="#F7FBF9" style="padding:16px 36px;border-top:1px solid #E8F7F0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;">&#128206; The invoice PDF is attached to this email.</p>
        </td>
      </tr>

      <!-- ── FOOTER ── -->
      <tr>
        <td bgcolor="#F0FAF6" style="padding:20px 36px;border-top:3px solid #008C5A;">
          <p style="margin:0 0 4px;font-size:12px;color:#6B7280;">
            <strong style="color:#0B0F0D;">${esc(config.pdf.name)}</strong>
            &nbsp;&middot;&nbsp;${esc(config.pdf.email)}
            &nbsp;&middot;&nbsp;${esc(config.pdf.phone)}
          </p>
          ${config.pdf.gstin ? `<p style="margin:4px 0 0;font-size:10px;color:#9CA3AF;font-family:'Courier New',monospace;">GSTIN: ${esc(config.pdf.gstin)}</p>` : ''}
          ${config.pdf.bank ? `<p style="margin:4px 0 0;font-size:10px;color:#9CA3AF;">${esc(config.pdf.bank.bankName)} &middot; A/C ${esc(config.pdf.bank.accountNo)} &middot; IFSC ${esc(config.pdf.bank.ifsc)}</p>` : ''}
          <p style="margin:8px 0 0;font-size:10px;color:#9CA3AF;">${esc(config.pdf.defaultFooterNote)}</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── SEYON STUDIO ───────────────────────────────────────────────────────────────
// Blue gradient header, premium creative studio aesthetic
function seyonHtml(invoice: InvoiceWithRelations, config: CompanyConfig): string {
  const bill = invoice.bill_to_company
  const address = formatAddress(bill)
  const items = invoice.invoice_items ?? []

  const itemRows = items.map((item, i) => `
    <tr bgcolor="${i % 2 === 0 ? '#FFFFFF' : '#F8FAFF'}">
      <td style="padding:12px 14px;font-size:13px;color:#0B1220;line-height:1.4;border-bottom:1px solid #E8EFF9;">
        ${esc(item.description)}
        ${item.hsn_sac ? `<br><span style="font-size:9px;color:#9CA3AF;font-family:'Courier New',monospace;">HSN: ${esc(item.hsn_sac)}</span>` : ''}
      </td>
      <td style="padding:12px 14px;font-size:12px;color:#6B7280;text-align:center;white-space:nowrap;border-bottom:1px solid #E8EFF9;">${item.qty} ${esc(item.unit ?? '')}</td>
      <td style="padding:12px 14px;font-size:12px;color:#6B7280;text-align:right;white-space:nowrap;border-bottom:1px solid #E8EFF9;">₹ ${fmt(item.rate)}</td>
      <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#0B1220;text-align:right;white-space:nowrap;border-bottom:1px solid #E8EFF9;">₹ ${fmt(item.total)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Invoice ${esc(invoice.invoice_no)} — SEYON STUDIO</title>
</head>
<body style="margin:0;padding:0;background:#EEF4FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#EEF4FF">
  <tr><td align="center" style="padding:36px 16px;">

    <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0"
           style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;">

      <!-- ── BLUE HEADER ── -->
      <tr>
        <td bgcolor="#1E3A8A" style="padding:36px 36px 32px;background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 100%);">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="top">
                <img src="cid:company-logo" alt="SEYON STUDIO" width="48" height="48"
                     style="display:block;border-radius:12px;margin-bottom:20px;object-fit:contain;background:#ffffff22;padding:4px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:600;letter-spacing:4px;color:#93C5FD;text-transform:uppercase;">Creative Studio</p>
                <h1 style="margin:0;font-size:28px;font-weight:900;color:#FFFFFF;letter-spacing:-1px;line-height:1.1;">SEYON STUDIO</h1>
              </td>
              <td valign="top" align="right" style="padding-left:16px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right">
                  <tr><td align="right">
                    <span style="background:rgba(255,255,255,0.15);color:#FFFFFF;font-size:11px;font-weight:700;padding:6px 16px;border-radius:24px;letter-spacing:1px;display:inline-block;border:1px solid rgba(255,255,255,0.3);white-space:nowrap;">#${esc(invoice.invoice_no)}</span>
                  </td></tr>
                  <tr><td height="12"></td></tr>
                  <tr><td align="right">
                    <p style="margin:0;color:#BFDBFE;font-size:13px;font-weight:500;">${esc(invoice.invoice_date)}</p>
                  </td></tr>
                  <tr><td height="10"></td></tr>
                  <tr><td align="right">${statusChipLight(invoice.status)}</td></tr>
                  <tr><td height="16"></td></tr>
                  <tr><td align="right">
                    <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:14px 20px;text-align:right;">
                      <p style="margin:0;font-size:10px;color:#BFDBFE;letter-spacing:2px;text-transform:uppercase;">Invoice Total</p>
                      <p style="margin:6px 0 0;font-size:24px;font-weight:900;color:#FFFFFF;letter-spacing:-1px;white-space:nowrap;">₹ ${fmt(invoice.grand_total)}</p>
                    </div>
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── BILL TO + INVOICE INFO ── -->
      <tr>
        <td style="padding:28px 36px;border-bottom:1px solid #DDE7F7;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" valign="top" style="padding-right:24px;">
                <p style="margin:0 0 10px;font-size:9px;font-weight:700;letter-spacing:3px;color:#2563EB;text-transform:uppercase;">Bill To</p>
                <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#0B1220;line-height:1.2;">${esc(bill?.company_name ?? '—')}</p>
                ${bill?.gstin ? `<p style="margin:0 0 4px;font-size:10px;color:#9CA3AF;font-family:'Courier New',monospace;">GSTIN: ${esc(bill.gstin)}</p>` : ''}
                ${address ? `<p style="margin:6px 0 0;font-size:12px;color:#555;line-height:1.7;">${address}</p>` : ''}
                ${bill?.phone ? `<p style="margin:4px 0 0;font-size:12px;color:#6B7280;">${esc(bill.phone)}</p>` : ''}
                ${bill?.email ? `<p style="margin:2px 0 0;font-size:12px;color:#6B7280;">${esc(bill.email)}</p>` : ''}
              </td>
              <td width="50%" valign="top" style="padding-left:24px;border-left:2px solid #EFF6FF;">
                <p style="margin:0 0 10px;font-size:9px;font-weight:700;letter-spacing:3px;color:#2563EB;text-transform:uppercase;">Invoice Info</p>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:12px;color:#9CA3AF;padding:3px 24px 3px 0;white-space:nowrap;">Invoice No.</td>
                    <td style="font-size:12px;color:#0B1220;font-weight:600;padding:3px 0;">${esc(invoice.invoice_no)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#9CA3AF;padding:3px 24px 3px 0;">Invoice Date</td>
                    <td style="font-size:12px;color:#0B1220;font-weight:600;padding:3px 0;">${esc(invoice.invoice_date)}</td>
                  </tr>
                  ${invoice.place_of_supply ? `<tr>
                    <td style="font-size:12px;color:#9CA3AF;padding:3px 24px 3px 0;white-space:nowrap;">Place of Supply</td>
                    <td style="font-size:12px;color:#0B1220;font-weight:600;padding:3px 0;">${esc(invoice.place_of_supply)}</td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── ITEMS ── -->
      <tr>
        <td style="padding:0 36px 4px;">
          <p style="margin:24px 0 14px;font-size:9px;font-weight:700;letter-spacing:3px;color:#2563EB;text-transform:uppercase;">Items &amp; Services</p>
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr bgcolor="#EFF6FF">
              <th style="text-align:left;padding:10px 14px;font-size:9px;font-weight:700;color:#1D4ED8;letter-spacing:1px;text-transform:uppercase;">Description</th>
              <th style="text-align:center;padding:10px 14px;font-size:9px;font-weight:700;color:#1D4ED8;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">Qty</th>
              <th style="text-align:right;padding:10px 14px;font-size:9px;font-weight:700;color:#1D4ED8;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">Rate</th>
              <th style="text-align:right;padding:10px 14px;font-size:9px;font-weight:700;color:#1D4ED8;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">Total</th>
            </tr>
            ${itemRows}
          </table>
        </td>
      </tr>

      <!-- ── TOTALS ── -->
      <tr>
        <td style="padding:0 36px 32px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr><td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right">
                <tr>
                  <td style="font-size:12px;color:#9CA3AF;padding:3px 36px 3px 0;white-space:nowrap;">Subtotal</td>
                  <td style="font-size:12px;color:#333;padding:3px 0;text-align:right;">₹ ${fmt(invoice.subtotal)}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#9CA3AF;padding:3px 36px 3px 0;">SGST</td>
                  <td style="font-size:12px;color:#333;padding:3px 0;text-align:right;">₹ ${fmt(invoice.total_sgst)}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#9CA3AF;padding:3px 36px 3px 0;">CGST</td>
                  <td style="font-size:12px;color:#333;padding:3px 0;text-align:right;">₹ ${fmt(invoice.total_cgst)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #DDE7F7;margin:0;"></td>
                </tr>
                <tr>
                  <td style="font-size:17px;font-weight:900;color:#2563EB;padding:4px 36px 4px 0;white-space:nowrap;">Grand Total</td>
                  <td style="font-size:17px;font-weight:900;color:#2563EB;padding:4px 0;text-align:right;white-space:nowrap;">₹ ${fmt(invoice.grand_total)}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td>
      </tr>

      ${invoice.amount_in_words ? `
      <tr>
        <td style="padding:14px 36px;border-top:1px solid #DDE7F7;">
          <p style="margin:0 0 4px;font-size:9px;color:#9CA3AF;letter-spacing:2px;text-transform:uppercase;">Amount in Words</p>
          <p style="margin:0;font-size:13px;color:#555;font-style:italic;">${esc(invoice.amount_in_words)}</p>
        </td>
      </tr>` : ''}

      ${invoice.notes ? `
      <tr>
        <td style="padding:14px 36px;border-top:1px solid #DDE7F7;">
          <p style="margin:0 0 6px;font-size:9px;color:#9CA3AF;letter-spacing:2px;text-transform:uppercase;">Notes</p>
          <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">${esc(invoice.notes)}</p>
        </td>
      </tr>` : ''}

      <!-- ── PDF NOTICE ── -->
      <tr>
        <td bgcolor="#F8FAFF" style="padding:16px 36px;border-top:1px solid #DDE7F7;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;">&#128206; The invoice PDF is attached to this email.</p>
        </td>
      </tr>

      <!-- ── FOOTER ── -->
      <tr>
        <td bgcolor="#EEF4FF" style="padding:20px 36px;border-top:3px solid #2563EB;">
          <p style="margin:0 0 4px;font-size:12px;color:#6B7280;">
            <strong style="color:#0B1220;">${esc(config.pdf.name)}</strong>
            &nbsp;&middot;&nbsp;${esc(config.pdf.email)}
            &nbsp;&middot;&nbsp;${esc(config.pdf.phone)}
          </p>
          ${config.pdf.gstin ? `<p style="margin:4px 0 0;font-size:10px;color:#9CA3AF;font-family:'Courier New',monospace;">GSTIN: ${esc(config.pdf.gstin)}</p>` : ''}
          <p style="margin:8px 0 0;font-size:10px;color:#9CA3AF;">${esc(config.pdf.defaultFooterNote)}</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

export function buildInvoiceEmailHtml(invoice: InvoiceWithRelations, config: CompanyConfig): string {
  if (config.id === 'inkdabba') return inkDabbaHtml(invoice, config)
  if (config.id === 'etc') return etcHtml(invoice, config)
  return seyonHtml(invoice, config)
}
