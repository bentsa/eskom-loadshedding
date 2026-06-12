/**
 * ImpactCard Component
 * 
 * Displays the AI impact analysis with risk level, score, and recommendations.
 * - Shows visual risk indicator (color-coded)
 * - Displays reasoning and breakdown
 * - Lists actionable recommendations
 * - Mobile-responsive design
 * - Minimal styling (consistent with existing dashboard)
 */

import React from 'react'
import { ImpactAnalysis, RiskLevel } from '../hooks/useImpactAnalyzer'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface ImpactCardProps {
  analysis: ImpactAnalysis | null
  isLoading?: boolean
  isExpanded?: boolean
  onToggleExpand?: (expanded: boolean) => void
}

/**
 * Get color scheme for risk level
 */
const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case 'Critical':
      return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444', icon: '🔴' }
    case 'High':
      return { bg: 'rgba(251, 146, 60, 0.1)', border: 'rgba(251, 146, 60, 0.3)', text: '#fb923c', icon: '🟠' }
    case 'Medium':
      return { bg: 'rgba(250, 204, 21, 0.1)', border: 'rgba(250, 204, 21, 0.3)', text: '#facc15', icon: '🟡' }
    case 'Low':
      return { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e', icon: '🟢' }
  }
}

/**
 * Get risk icon component
 */
const getRiskIcon = (level: RiskLevel) => {
  const iconProps = { size: 20 }
  switch (level) {
    case 'Critical':
      return <AlertCircle {...iconProps} style={{ color: '#ef4444' }} />
    case 'High':
      return <AlertTriangle {...iconProps} style={{ color: '#fb923c' }} />
    case 'Medium':
      return <TrendingUp {...iconProps} style={{ color: '#facc15' }} />
    case 'Low':
      return <CheckCircle2 {...iconProps} style={{ color: '#22c55e' }} />
  }
}

export const ImpactCard: React.FC<ImpactCardProps> = ({
  analysis,
  isLoading = false,
  isExpanded = false,
  onToggleExpand,
}) => {
  if (!analysis) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '13px',
      }}>
        {isLoading ? '⏳ Analyzing impact...' : 'No analysis available'}
      </div>
    )
  }

  const colors = getRiskColor(analysis.riskLevel)

  return (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          cursor: onToggleExpand ? 'pointer' : 'default',
        }}
        onClick={() => onToggleExpand?.(!isExpanded)}
        role={onToggleExpand ? 'button' : undefined}
        tabIndex={onToggleExpand ? 0 : undefined}
        onKeyDown={(e) => {
          if (onToggleExpand && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onToggleExpand(!isExpanded)
          }
        }}
        aria-expanded={isExpanded}
        aria-label={`Impact analysis: ${analysis.riskLevel} risk`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          {getRiskIcon(analysis.riskLevel)}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '12px', color: colors.text, fontWeight: '700' }}>
              {analysis.riskLevel} Risk
            </p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', wordWrap: 'break-word' }}>
              {analysis.reason}
            </p>
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'right', marginRight: '12px', minWidth: '50px', flexShrink: 0 }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: colors.text,
          }}>
            {analysis.riskScore}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Score</div>
        </div>

        {/* Toggle */}
        {onToggleExpand && (
          isExpanded ? <ChevronUp size={18} style={{ color: '#64748b', flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: '#64748b', flexShrink: 0 }} />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${colors.border}`, padding: '16px' }}>
          {/* Explanation */}
          <p style={{
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#cbd5e1',
            marginBottom: '16px',
          }}>
            {analysis.explanation}
          </p>

          {/* Factor Breakdown */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '10px' }}>
              Risk Breakdown
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(analysis.factors).map(([key, factor]) => {
                const factorLabel = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, c => c.toUpperCase())
                  .trim()

                return (
                  <div key={key} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '11px', fontWeight: '600', color: '#cbd5e1' }}>
                        {factorLabel}
                      </p>
                      <p style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                        {factor.detail}
                      </p>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: factor.score > 60 ? '#ef4444' : factor.score > 30 ? '#fb923c' : '#22c55e',
                      minWidth: '35px',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}>
                      {factor.score}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lightbulb size={14} /> Recommendations
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analysis.recommendations.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#cbd5e1',
                    lineHeight: '1.5',
                  }}
                >
                  <span style={{
                    color: '#6366f1',
                    fontWeight: '700',
                    minWidth: '18px',
                    flexShrink: 0,
                  }}>
                    {i + 1}.
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImpactCard
