import type { CalculatedLine, InvoiceLineInput, InvoiceTotals } from '@/lib/types/invoice'
import { amountInWords } from './amountInWords'

export function calculateLine(input: InvoiceLineInput): CalculatedLine {
  const qty = Number(input.qty) || 0
  const rate = Number(input.rate) || 0
  const sgstPct = Number(input.sgst_percent) || 0
  const cgstPct = Number(input.cgst_percent) || 0

  const amount = round2(qty * rate)
  const sgst_amount = round2(amount * sgstPct / 100)
  const cgst_amount = round2(amount * cgstPct / 100)
  const total = round2(amount + sgst_amount + cgst_amount)

  return {
    item_id: input.item_id,
    description: input.description,
    hsn_sac: input.hsn_sac,
    qty,
    unit: input.unit,
    rate,
    amount,
    sgst_percent: sgstPct,
    sgst_amount,
    cgst_percent: cgstPct,
    cgst_amount,
    total,
  }
}

export function calculateTotals(lines: CalculatedLine[]): InvoiceTotals {
  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0))
  const total_sgst = round2(lines.reduce((s, l) => s + l.sgst_amount, 0))
  const total_cgst = round2(lines.reduce((s, l) => s + l.cgst_amount, 0))
  const grand_total = round2(subtotal + total_sgst + total_cgst)

  return {
    subtotal,
    total_sgst,
    total_cgst,
    grand_total,
    amount_in_words: amountInWords(grand_total),
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}
