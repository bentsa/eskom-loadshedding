/**
 * User Profile Types
 * 
 * Defines the structure of a user profile for the LoadShedding AI system.
 * Profiles store user preferences, constraints, and context for personalized
 * risk analysis and recommendations.
 */

export type UserType = 'Student' | 'RemoteWorker' | 'SmallBusinessOwner'

export interface WorkHours {
  /**
   * Start time in HH:mm format (24-hour)
   * @example "08:00"
   */
  start: string
  /**
   * End time in HH:mm format (24-hour)
   * @example "17:00"
   */
  end: string
}

export interface UserProfile {
  /**
   * Unique identifier (optional, can use for future multi-profile support)
   */
  id?: string

  /**
   * User's type/role
   * - Student: Prioritizes study hours, online learning
   * - RemoteWorker: Prioritizes work hours, home-based productivity
   * - SmallBusinessOwner: Prioritizes business operations, customer availability
   */
  userType: UserType

  /**
   * Hours of battery backup available (0-24)
   * Used to calculate how long critical tasks can run during outages
   */
  batteryBackupHours: number

  /**
   * Whether user has internet backup (e.g., mobile hotspot, secondary ISP)
   * Critical for remote workers and business owners
   */
  internetBackup: boolean

  /**
   * Primary working/study hours when productivity is critical
   * Used to detect scheduling conflicts
   */
  workHours: WorkHours

  /**
   * Timestamp of last profile update
   */
  updatedAt: number
}

/**
 * Default profile template
 * Used when a new user first opens the app
 */
export const DEFAULT_PROFILE: UserProfile = {
  userType: 'Student',
  batteryBackupHours: 4,
  internetBackup: false,
  workHours: {
    start: '08:00',
    end: '17:00',
  },
  updatedAt: Date.now(),
}

/**
 * Profile validation helper
 * Ensures profile has required fields and valid values
 */
export const validateProfile = (profile: unknown): profile is UserProfile => {
  if (!profile || typeof profile !== 'object') return false
  const p = profile as Record<string, unknown>
  return (
    ['Student', 'RemoteWorker', 'SmallBusinessOwner'].includes(p.userType as string) &&
    typeof p.batteryBackupHours === 'number' &&
    p.batteryBackupHours >= 0 &&
    p.batteryBackupHours <= 24 &&
    typeof p.internetBackup === 'boolean' &&
    typeof p.workHours === 'object' &&
    (p.workHours as Record<string, unknown>).start &&
    (p.workHours as Record<string, unknown>).end
  )
}
