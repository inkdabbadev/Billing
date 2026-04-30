const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]
const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
]

function belowThousand(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ones[n]
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
  return (
    ones[Math.floor(n / 100)] +
    ' Hundred' +
    (n % 100 ? ' ' + belowThousand(n % 100) : '')
  )
}

export function amountInWords(amount: number): string {
  const n = Math.round(amount * 100)
  const rupees = Math.floor(n / 100)
  const paise = n % 100

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only'

  const parts: string[] = []

  const crore = Math.floor(rupees / 10000000)
  const lakh = Math.floor((rupees % 10000000) / 100000)
  const thousand = Math.floor((rupees % 100000) / 1000)
  const rem = rupees % 1000

  if (crore) parts.push(belowThousand(crore) + ' Crore')
  if (lakh) parts.push(belowThousand(lakh) + ' Lakh')
  if (thousand) parts.push(belowThousand(thousand) + ' Thousand')
  if (rem) parts.push(belowThousand(rem))

  let result = parts.join(' ') + ' Rupees'
  if (paise) result += ' and ' + belowThousand(paise) + ' Paise'
  result += ' Only'

  return result
}
