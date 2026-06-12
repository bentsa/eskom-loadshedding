/**
 * useImpactAnalyzer Hook
 * 
 * AI-powered risk analysis for load shedding impact on the user.
 * Analyzes:
 * - Conflict between work hours and outages
 * - Battery backup adequacy
 * - Internet backup needs
 * - Overall risk score
 * 
 * Returns structured JSON with risk level, reasoning, and recommendations.
 */

import { useMemo } from 'react'
import { UserProfile } from '../types/profile'
import { timeStringToMinutes } from './useUserProfile'

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export interface ImpactAnalysis {
  /**
   * Overall risk level based on all factors
   */
  riskLevel: RiskLevel

  /**
   * Numeric score 0-100 (higher = worse)
   */
  riskScore: number

  /**
   * Primary reason for this risk level
   */
  reason: string

  /**
   * Detailed explanation for the user
   */
  explanation: string

  /**
   * Actionable recommendations (prioritized)
   */
  recommendations: string[]

  /**
   * Breakdown of individual factors
   */
  factors: {
    workHourConflict: { score: number; detail: string }
    batteryAdequacy: { score: number; detail: string }
    internetBackupNeed: { score: number; detail: string }
    userTypeImpact: { score: number; detail: string }
  }
}

/**
 * Outage window type
 */
export interface OutageWindow {
  start: number // minutes since midnight
  end: number
  label: string
}

/**
 * Analyze the impact of outages on the user's profile
 *
 * @param profile User profile with preferences and constraints
 * @param outages List of scheduled outages for today
 * @param outageCount Number of outages today (for stage inference)
 * @param totalOutageMins Total minutes of outages today
 * @returns Detailed impact analysis with risk level and recommendations
 *
 * @example
 * const analysis = analyzeImpact(profile, outages, 3, 180)
 * // { riskLevel: 'High', riskScore: 72, reason: '...', ... }
 */
export const analyzeImpact = (
  profile: UserProfile,
  outages: OutageWindow[],
  outageCount: number,
  totalOutageMins: number
): ImpactAnalysis => {
  const workStartMins = timeStringToMinutes(profile.workHours.start)
  const workEndMins = timeStringToMinutes(profile.workHours.end)
  const workDurationMins = workEndMins - workStartMins

  // ─────────────────────────────────────────────────────────────
  // Factor 1: Work Hour Conflict
  // ─────────────────────────────────────────────────────────────
  let conflictMins = 0
  for (const outage of outages) {
    const overlapStart = Math.max(outage.start, workStartMins)
    const overlapEnd = Math.min(outage.end, workEndMins)
    if (overlapStart < overlapEnd) {
      conflictMins += overlapEnd - overlapStart
    }
  }

  const conflictPct = workDurationMins > 0 ? (conflictMins / workDurationMins) * 100 : 0
  const workConflictScore = Math.min(100, conflictPct * 1.5)

  const workConflictDetail =
    conflictPct === 0
      ? '✓ No outages during work/study hours'
      : conflictPct < 25
        ? `${conflictPct.toFixed(0)}% of work hours affected`
        : conflictPct < 50
          ? `${conflictPct.toFixed(0)}% of work hours interrupted`
          : `${conflictPct.toFixed(0)}% — Critical work disruption`

  // ─────────────────────────────────────────────────────────────
  // Factor 2: Battery Backup Adequacy
  // ─────────────────────────────────────────────────────────────
  const longestOutageMins = Math.max(...outages.map(o => o.end - o.start), 0)
  const batteryBackupMins = profile.batteryBackupHours * 60
  const batteryAdequate = batteryBackupMins >= longestOutageMins
  const batteryScore = batteryAdequate ? 0 : Math.min(60, ((longestOutageMins - batteryBackupMins) / 60) * 10)

  const batteryDetail = batteryAdequate
    ? `✓ ${profile.batteryBackupHours}h backup covers longest outage (${(longestOutageMins / 60).toFixed(1)}h)`
    : `✗ Backup insufficient: have ${profile.batteryBackupHours}h, need ${(longestOutageMins / 60).toFixed(1)}h`

  // ─────────────────────────────────────────────────────────────
  // Factor 3: Internet Backup Need
  // ─────────────────────────────────────────────────────────────
  const needsInternet =
    profile.userType === 'RemoteWorker' || profile.userType === 'SmallBusinessOwner'
  const internetScore =
    needsInternet && !profile.internetBackup && conflictPct > 0
      ? Math.min(50, conflictPct * 0.8)
      : 0

  const internetDetail =
    needsInternet && !profile.internetBackup && conflictPct > 0
      ? `⚠ ${profile.userType} without mobile data backup during outages`
      : profile.internetBackup
        ? '✓ Mobile/secondary internet available'
        : '✓ Not critical for your role'

  // ─────────────────────────────────────────────────────────────
  // Factor 4: User Type Impact
  // ─────────────────────────────────────────────────────────────
  const userTypeScores: Record<string, number> = {
    Student: totalOutageMins > 180 ? 30 : totalOutageMins > 120 ? 20 : 10,
    RemoteWorker: totalOutageMins > 180 ? 40 : totalOutageMins > 120 ? 25 : 15,
    SmallBusinessOwner: totalOutageMins > 180 ? 50 : totalOutageMins > 120 ? 35 : 20,
  }

  const userTypeScore = userTypeScores[profile.userType] || 20
  const userTypeDetail = `${profile.userType} · ${outageCount} outage(s) totaling ${(totalOutageMins / 60).toFixed(1)}h`

  // ─────────────────────────────────────────────────────────────
  // Combined Risk Score
  // ─────────────────────────────────────────────────────────────
  const allFactors = [workConflictScore, batteryScore, internetScore, userTypeScore]
  const riskScore = Math.round(allFactors.reduce((a, b) => a + b, 0) / 4)

  const riskLevel: RiskLevel =
    riskScore >= 75
      ? 'Critical'
      : riskScore >= 50
        ? 'High'
        : riskScore >= 25
          ? 'Medium'
          : 'Low'

  // ─────────────────────────────────────────────────────────────
  // Reasoning & Recommendations
  // ─────────────────────────────────────────────────────────────
  let reason = ''
  const recommendations: string[] = []

  if (riskScore >= 75) {
    reason = `Critical: ${
      conflictPct > 50
        ? 'Most of your work hours have outages scheduled'
        : 'Battery backup insufficient for today\'s outages'
    }`
  } else if (riskScore >= 50) {
    reason = `High: ${
      conflictPct > 25
        ? 'Significant outage overlap with work/study hours'
        : 'Limited battery backup for extended outages'
    }`
  } else if (riskScore >= 25) {
    reason = `Medium: Some outages during working hours — plan accordingly`
  } else {
    reason = `Low: Outages outside work hours or short duration`
  }

  // Generate personalized recommendations
  if (conflictPct > 50) {
    recommendations.push(
      `Reschedule critical tasks to avoid ${outages
        .filter(o => o.start >= workStartMins && o.start < workEndMins)
        .map(o => o.label)
        .join(', ')}`
    )
  } else if (conflictPct > 0) {
    recommendations.push(
      `Start power-intensive work before ${outages[0]?.label.split('–')[0] || '10:00'} to avoid interruption`
    )
  }

  if (!batteryAdequate) {
    recommendations.push(
      `Upgrade battery backup: ${profile.userType === 'Student' ? 'at least 3–5h' : 'at least 6–8h'} UPS recommended`
    )
  }

  if (needsInternet && !profile.internetBackup && conflictPct > 0) {
    recommendations.push(`Get mobile data backup: keep 2GB+ data for emergency connectivity during cuts`)
  }

  if (profile.userType === 'RemoteWorker' && conflictPct > 25) {
    recommendations.push(
      `Inform clients/colleagues of outage windows: ${outages.map(o => o.label).join(', ')}`
    )
  }

  if (profile.userType === 'Student' && conflictPct > 25) {
    recommendations.push(`Download course materials & recordings before outages begin`)
  }

  // Generic fallback for low-risk scenarios
  if (recommendations.length === 0) {
    recommendations.push(`Continue normal work — minimal outage impact expected`)
    recommendations.push(`Still recommended: keep devices charged as precaution`)
  }

  // Ensure we have at least 2–3 recommendations
  if (recommendations.length < 2) {
    if (!recommendations.some(r => r.includes('data'))) {
      recommendations.push(`Keep offline tools ready: code editors, note-taking apps, etc.`)
    }
  }

  const explanation =
    riskLevel === 'Critical'
      ? `Today is challenging: most of your ${profile.userType === 'Student' ? 'study' : 'work'} hours overlap with scheduled outages. Battery backup may be insufficient. Plan to work offline or adjust your schedule.`
      : riskLevel === 'High'
        ? `Significant disruptions expected during your active hours. Multiple outages may interrupt tasks. Battery and internet backup are essential.`
        : riskLevel === 'Medium'
          ? `Manageable: a few outages fall during your working hours, but you have time between cuts for critical tasks.`
          : `Good conditions: most outages are outside your work hours, or short enough for your battery to handle.`

  return {
    riskLevel,
    riskScore,
    reason,
    explanation,
    recommendations,
    factors: {
      workHourConflict: { score: Math.round(workConflictScore), detail: workConflictDetail },
      batteryAdequacy: { score: Math.round(batteryScore), detail: batteryDetail },
      internetBackupNeed: { score: Math.round(internetScore), detail: internetDetail },
      userTypeImpact: { score: Math.round(userTypeScore), detail: userTypeDetail },
    },
  }
}

/**
 * Hook version of analyzeImpact
 * Memoizes the analysis to avoid recalculation
 */
export const useImpactAnalyzer = (
  profile: UserProfile,
  outages: OutageWindow[],
  outageCount: number,
  totalOutageMins: number
): ImpactAnalysis => {
  return useMemo(
    () => analyzeImpact(profile, outages, outageCount, totalOutageMins),
    [profile, outages, outageCount, totalOutageMins]
  )
}
