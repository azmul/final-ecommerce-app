import { RISK_LEVEL_THRESHOLDS } from '@/lib/risk/config'
import type { RiskFlag, RiskLevel, RiskScoreResult } from '@/lib/risk/types'

export function scoreToLevel(score: number): RiskLevel {
  if (score >= RISK_LEVEL_THRESHOLDS.high) return 'high'
  if (score >= RISK_LEVEL_THRESHOLDS.medium) return 'medium'
  return 'low'
}

export function buildRiskScoreResult(flags: RiskFlag[]): RiskScoreResult {
  const score = Math.min(
    100,
    flags.reduce((total, entry) => total + entry.weight, 0),
  )

  return {
    score,
    level: scoreToLevel(score),
    flags,
  }
}

export function defaultReviewStatus(level: RiskLevel): 'pending' | 'cleared' {
  return level === 'high' ? 'pending' : 'cleared'
}
