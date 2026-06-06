export type RiskLevel = 'low' | 'medium' | 'high'

export type RiskReviewStatus = 'pending' | 'cleared' | 'confirmed_fraud'

export type RiskFlag = {
  flag: string
  weight: number
  detail?: string | null
}

export type RiskAssessmentData = {
  riskScore: number
  riskLevel: RiskLevel
  riskFlags: RiskFlag[]
  riskReviewStatus: RiskReviewStatus
  riskReviewedAt?: string | null
  riskReviewedBy?: number | null
  riskCapturedIp?: string | null
  riskCapturedUserAgent?: string | null
}

export type RequestContext = {
  ip: string | null
  userAgent: string | null
}

export type RiskScoreResult = {
  score: number
  level: RiskLevel
  flags: RiskFlag[]
}
