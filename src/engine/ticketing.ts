import type { Journey } from './types'

export interface Ticketing {
  /** Number of separate tickets (≈ one per operator). */
  ticketCount: number
  /** Single through-ticket with guaranteed connections. */
  through: boolean
  /** Journey crosses more than one country. */
  international: boolean
  /** Legs with a compulsory seat reservation. */
  reservations: number
  operators: string[]
}

/**
 * Estimate how a journey ticketises. Heuristic: one ticket per operator
 * (multiple trains of the same operator travel on one ticket). A single
 * operator throughout = a through-ticket with connection protection.
 */
export function journeyTicketing(j: Journey): Ticketing {
  const operators: string[] = []
  for (const l of j.legs) if (!operators.includes(l.operator.id)) operators.push(l.operator.id)
  const countries = new Set<string>()
  for (const l of j.legs) { countries.add(l.from.country); countries.add(l.to.country) }
  const reservations = j.legs.filter((l) => l.reservation === 'required').length
  return {
    ticketCount: Math.max(1, operators.length),
    through: operators.length === 1,
    international: countries.size > 1,
    reservations,
    operators,
  }
}
