/**
 * ProfileSetup Component
 * 
 * Clean, modal-based setup UI for users to configure their profile on first use.
 * - Minimal dependencies (no new packages)
 * - Mobile-responsive design
 * - Consistent with existing dashboard styling
 * - Integrates with useUserProfile hook
 */

import React, { useState } from 'react'
import { UserType, WorkHours } from '../types/profile'
import { timeStringToMinutes, minutesToTimeString } from '../hooks/useUserProfile'
import {
  GraduationCap,
  Laptop,
  Store,
  Battery,
  Wifi,
  Clock,
  CheckCircle,
  ChevronRight,
  Settings,
} from 'lucide-react'

interface ProfileSetupProps {
  /**
   * Called when user completes setup
   */
  onComplete: (userType: UserType, batteryHours: number, internetBackup: boolean, workHours: WorkHours) => void
  /**
   * Allow skipping setup (optional)
   */
  onSkip?: () => void
}

/**
 * ProfileSetup - Modal-based initial setup component
 * 
 * Flow:
 * 1. Select user type
 * 2. Configure battery backup
 * 3. Configure internet backup
 * 4. Set work hours
 * 5. Review & confirm
 */
export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [userType, setUserType] = useState<UserType>('Student')
  const [batteryHours, setBatteryHours] = useState(4)
  const [internetBackup, setInternetBackup] = useState(false)
  const [workHours, setWorkHours] = useState<WorkHours>({ start: '08:00', end: '17:00' })

  const handleNext = () => {
    if (step < 5) setStep((step + 1) as any)
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as any)
  }

  const handleComplete = () => {
    onComplete(userType, batteryHours, internetBackup, workHours)
  }

  const userTypeOptions = [
    {
      value: 'Student' as UserType,
      icon: GraduationCap,
      label: 'Student',
      description: 'Prioritizes study hours & online learning',
    },
    {
      value: 'RemoteWorker' as UserType,
      icon: Laptop,
      label: 'Remote Worker',
      description: 'Home-based productivity & meetings',
    },
    {
      value: 'SmallBusinessOwner' as UserType,
      icon: Store,
      label: 'Small Business Owner',
      description: 'Business operations & customer availability',
    },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(12, 12, 20, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 40px 80px rgba(0, 0, 0, 0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Settings size={18} style={{ color: '#818cf8' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>
            Profile Setup
          </h2>
          <span style={{
            marginLeft: 'auto',
            fontSize: '12px',
            color: '#64748b',
          }}>
            Step {step}/5
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '2px',
          marginBottom: '24px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${(step / 5) * 100}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Step 1: User Type */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', fontWeight: '600' }}>
              What's your role?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {userTypeOptions.map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    onClick={() => setUserType(opt.value)}
                    style={{
                      background: userType === opt.value ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: userType === opt.value ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={18} style={{ color: userType === opt.value ? '#818cf8' : '#64748b' }} />
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>{opt.label}</p>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>{opt.description}</p>
                    </div>
                    {userType === opt.value && (
                      <CheckCircle size={16} style={{ color: '#6366f1' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Battery Backup */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>
              Battery Backup Hours
            </p>
            <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px' }}>
              How long can critical devices run during an outage?
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <Battery size={24} style={{ color: '#34d399' }} />
              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.5"
                  value={batteryHours}
                  onChange={e => setBatteryHours(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                  {batteryHours.toFixed(1)} hours
                </p>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>
              💡 <strong>Tip:</strong> Stage 3+ outages: 2–3h UPS recommended. Stage 1–2: 1–2h sufficient.
            </p>
          </div>
        )}

        {/* Step 3: Internet Backup */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', fontWeight: '600' }}>
              Internet Backup
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {[true, false].map(has => (
                <button
                  key={String(has)}
                  onClick={() => setInternetBackup(has)}
                  style={{
                    background: internetBackup === has ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: internetBackup === has ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Wifi size={18} style={{ color: internetBackup === has ? '#34d399' : '#64748b' }} />
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>
                      {has ? '✓ Yes, I have backup internet' : '✗ No backup internet'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748b' }}>
                      {has ? 'Mobile hotspot or secondary ISP' : 'Fibre only (no mobile backup)'}
                    </p>
                  </div>
                  {internetBackup === has && (
                    <CheckCircle size={16} style={{ color: '#34d399' }} />
                  )}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>
              📱 Mobile data stays online during load shedding — critical for remote work & staying in touch.
            </p>
          </div>
        )}

        {/* Step 4: Work Hours */}
        {step === 4 && (
          <div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Work/Study Hours
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Start', key: 'start' as const },
                { label: 'End', key: 'end' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                    {label} Time
                  </label>
                  <input
                    type="time"
                    value={workHours[key]}
                    onChange={e => setWorkHours({ ...workHours, [key]: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#f1f5f9',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>
              ⏰ AI Planner will schedule power-dependent tasks only within these hours.
            </p>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', fontWeight: '600' }}>
              Review Your Profile
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {[
                { icon: '👤', label: 'Type', value: userType },
                { icon: '🔋', label: 'Battery', value: `${batteryHours.toFixed(1)}h` },
                { icon: '📱', label: 'Internet Backup', value: internetBackup ? 'Yes' : 'No' },
                { icon: '⏰', label: 'Work Hours', value: `${workHours.start}–${workHours.end}` },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {item.icon} {item.label}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#f1f5f9' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#475569' }}>
              ✅ Ready to go! You can update these settings anytime from Settings.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          {step > 1 && (
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Back
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={handleNext}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#f1f5f9',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#f1f5f9',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle size={14} /> Complete
            </button>
          )}
          {onSkip && step === 1 && (
            <button
              onClick={onSkip}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '10px 16px',
              }}
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileSetup
