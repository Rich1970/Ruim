import type { Leg, Journey } from './types'

export type TransferLevel = 'tight' | 'fair' | 'roomy'

export interface TransferInfo {
  minutes: number
  level: TransferLevel
  crossOperator: boolean
  international: boolean
}

/**
 * Classify a transfer's risk. Cross-operator / international changes need much
 * more margin (separate tickets, no waiting for each other) than a change
 * within one operator, where connections are usually protected.
 */
export function classifyTransfer(prev: Leg, next: Leg): TransferInfo {
  const minutes = (next.depDayOffset * 1440 + next.depMin) - (prev.arrDayOffset * 1440 + prev.arrMin)
  const crossOperator = prev.operator.id !== next.operator.id
  const international = prev.to.country !== next.from.country
  let level: TransferLevel
  if (crossOperator || international) {
    level = minutes < 15 ? 'tight' : minutes < 25 ? 'fair' : 'roomy'
  } else {
    level = minutes < 8 ? 'tight' : minutes < 15 ? 'fair' : 'roomy'
  }
  return { minutes, level, crossOperator, international }
}

/** The riskiest transfer in a journey (for a card-level warning). */
export function riskiestTransfer(j: Journey): TransferInfo | null {
  let worst: TransferInfo | null = null
  const rank: Record<TransferLevel, number> = { tight: 0, fair: 1, roomy: 2 }
  for (let i = 0; i < j.legs.length - 1; i++) {
    const info = classifyTransfer(j.legs[i], j.legs[i + 1])
    if (!worst || rank[info.level] < rank[worst.level]) worst = info
  }
  return worst
}
