'use client'

import { Button, toast, useDocumentInfo } from '@payloadcms/ui'

import { getRiskFlagLabel } from '@/lib/risk/flagCatalog'

type RiskFlagRow = {
  flag?: string | null
  weight?: number | null
  detail?: string | null
  id?: string | null
}

type RiskAssessmentDoc = {
  riskAssessment?: {
    riskScore?: number | null
    riskLevel?: string | null
    riskReviewStatus?: string | null
    riskFlags?: RiskFlagRow[] | null
  } | null
}

const levelColors: Record<string, string> = {
  high: '#b42318',
  medium: '#b54708',
  low: '#027a48',
}

export const RiskAssessmentPanel = () => {
  const { data } = useDocumentInfo()
  const assessment = (data as RiskAssessmentDoc | undefined)?.riskAssessment

  if (!assessment?.riskLevel || assessment.riskLevel === 'low') {
    return null
  }

  const flags = assessment.riskFlags ?? []
  const level = assessment.riskLevel
  const color = levelColors[level] ?? '#344054'

  return (
    <div
      style={{
        background: 'var(--theme-elevation-50)',
        border: `1px solid ${color}`,
        borderRadius: 8,
        marginBottom: 16,
        padding: '12px 16px',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <strong style={{ color, fontSize: 14, textTransform: 'uppercase' }}>
          Risk: {level} ({assessment.riskScore ?? 0})
        </strong>
        {assessment.riskReviewStatus ? (
          <span
            style={{
              background: 'var(--theme-elevation-100)',
              borderRadius: 4,
              fontSize: 12,
              padding: '2px 8px',
            }}
          >
            Review: {assessment.riskReviewStatus.replace(/_/g, ' ')}
          </span>
        ) : null}
      </div>
      {flags.length > 0 ? (
        <ul style={{ fontSize: 13, margin: '10px 0 0', paddingLeft: 18 }}>
          {flags.map((entry) => (
            <li key={entry.id ?? `${entry.flag}-${entry.weight}`}>
              {getRiskFlagLabel(entry.flag ?? '')} (+{entry.weight ?? 0})
              {entry.detail ? ` — ${entry.detail}` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
