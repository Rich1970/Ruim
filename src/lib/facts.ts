import type { Facts } from './storage'

// Alle berekeningen in woorden — nooit grafieken.

export function netBurn(f: Facts): number {
  return Math.max(0, f.monthlyFixed - f.passiveIncome)
}

// Runway in maanden bij een gegeven vermogen. Infinity als het passieve
// inkomen de lasten dekt.
export function runwayMonths(f: Facts, total = f.total): number {
  const burn = netBurn(f)
  if (burn <= 0) return Infinity
  return total / burn
}

export function monthsToText(months: number): string {
  if (!isFinite(months)) return 'onbeperkt'
  const total = Math.floor(months)
  const y = Math.floor(total / 12)
  const m = total % 12
  const parts: string[] = []
  if (y > 0) parts.push(`${y} ${y === 1 ? 'jaar' : 'jaar'}`)
  if (m > 0) parts.push(`${m} ${m === 1 ? 'maand' : 'maanden'}`)
  if (parts.length === 0) return 'minder dan een maand'
  return parts.join(' en ')
}

export function euro(n: number): string {
  return '€' + Math.round(n).toLocaleString('nl-NL')
}

export function percent(n: number, decimals = 1): string {
  return n.toLocaleString('nl-NL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + '%'
}

export function freedomProgress(f: Facts): number {
  if (f.freedomNumber <= 0) return 0
  return Math.min(100, (f.passiveIncome / f.freedomNumber) * 100)
}

export function monthlyCostPercent(f: Facts): number {
  if (f.total <= 0) return 0
  return (netBurn(f) / f.total) * 100
}

// Voor "Nu even niet oké": een bedrag afgezet tegen de runway.
export function amountImpact(f: Facts, amount: number) {
  const before = runwayMonths(f)
  const after = runwayMonths(f, f.total - amount)
  const pctOfTotal = f.total > 0 ? (amount / f.total) * 100 : 0
  return {
    pctOfTotal,
    beforeText: monthsToText(before),
    afterText: monthsToText(after),
    changed: monthsToText(before) !== monthsToText(after),
  }
}
