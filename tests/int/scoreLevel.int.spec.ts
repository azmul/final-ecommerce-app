import { describe, expect, it } from 'vitest'

import { RISK_LEVEL_THRESHOLDS } from '@/lib/risk/config'
import { buildRiskScoreResult, defaultReviewStatus, scoreToLevel } from '@/lib/risk/scoreLevel'
import type { RiskFlag } from '@/lib/risk/types'

describe('scoreLevel', () => {
  it('maps scores to risk levels', () => {
    expect(scoreToLevel(0)).toBe('low')
    expect(scoreToLevel(RISK_LEVEL_THRESHOLDS.medium - 1)).toBe('low')
    expect(scoreToLevel(RISK_LEVEL_THRESHOLDS.medium)).toBe('medium')
    expect(scoreToLevel(RISK_LEVEL_THRESHOLDS.high - 1)).toBe('medium')
    expect(scoreToLevel(RISK_LEVEL_THRESHOLDS.high)).toBe('high')
  })

  it('caps total score at 100', () => {
    const flags: RiskFlag[] = Array.from({ length: 10 }, (_, index) => ({
      flag: `flag_${index}`,
      weight: 20,
    }))

    expect(buildRiskScoreResult(flags)).toEqual({
      score: 100,
      level: 'high',
      flags,
    })
  })

  it('sets pending review only for high risk', () => {
    expect(defaultReviewStatus('low')).toBe('cleared')
    expect(defaultReviewStatus('medium')).toBe('cleared')
    expect(defaultReviewStatus('high')).toBe('pending')
  })
})
