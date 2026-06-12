/**
 * useUserProfile Hook
 * 
 * Manages user profile persistence in localStorage with validation and defaults.
 * - Automatically loads profile on mount
 * - Saves changes to localStorage atomically
 * - Validates profile structure before use
 * - Provides sensible defaults for new users
 */

import { useState, useEffect, useCallback } from 'react'
import { UserProfile, validateProfile, DEFAULT_PROFILE } from '../types/profile'

const PROFILE_STORAGE_KEY = 'powerwise_user_profile'

interface UseUserProfileReturn {
  profile: UserProfile
  updateProfile: (updates: Partial<UserProfile>) => void
  resetProfile: () => void
  isLoading: boolean
  error: string | null
}

/**
 * Hook to manage user profile lifecycle
 * 
 * @example
 * const { profile, updateProfile } = useUserProfile()
 * 
 * // Update battery hours
 * updateProfile({ batteryBackupHours: 8 })
 */
export const useUserProfile = (): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load profile from localStorage on component mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
      
      if (stored) {
        const parsed = JSON.parse(stored)
        
        // Validate the loaded profile
        if (validateProfile(parsed)) {
          setProfile(parsed)
          setError(null)
        } else {
          console.warn('[useUserProfile] Stored profile failed validation, using defaults')
          setProfile(DEFAULT_PROFILE)
          setError('Profile validation failed')
        }
      } else {
        // First time user
        setProfile(DEFAULT_PROFILE)
        setError(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[useUserProfile] Load error:', message)
      setProfile(DEFAULT_PROFILE)
      setError(`Failed to load profile: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Save updated profile to localStorage
   */
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    try {
      const updated: UserProfile = {
        ...profile,
        ...updates,
        updatedAt: Date.now(),
      }

      // Validate before saving
      if (!validateProfile(updated)) {
        setError('Invalid profile data')
        return
      }

      // Save to localStorage
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
      setProfile(updated)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[useUserProfile] Update error:', message)
      setError(`Failed to update profile: ${message}`)
    }
  }, [profile])

  /**
   * Reset profile to defaults
   */
  const resetProfile = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY)
      setProfile(DEFAULT_PROFILE)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[useUserProfile] Reset error:', message)
      setError(`Failed to reset profile: ${message}`)
    }
  }, [])

  return { profile, updateProfile, resetProfile, isLoading, error }
}

/**
 * Helper to convert HH:mm time string to minutes since midnight
 * @param time Time in HH:mm format
 * @returns Minutes since midnight
 */
export const timeStringToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Helper to convert minutes since midnight to HH:mm string
 * @param minutes Minutes since midnight
 * @returns Time in HH:mm format
 */
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}
