# Feature 1: User Profile System - Implementation Guide

## Overview

This document explains the complete implementation of **Feature 1: User Profile System** for PowerWise AI.

The system allows users to:
- Define their role (Student, Remote Worker, Small Business Owner)
- Specify battery backup hours
- Indicate internet backup availability
- Set work/study hours
- Persist profile in localStorage
- Automatically load profile on app startup

---

## Files Created

### 1. **frontend/src/types/profile.ts**
**Purpose:** TypeScript type definitions for user profiles

**Key Exports:**
```typescript
- UserType: 'Student' | 'RemoteWorker' | 'SmallBusinessOwner'
- UserProfile: Main interface with all user settings
- validateProfile(): Validates profile structure
- DEFAULT_PROFILE: Template for new users
```

**Why:** Ensures type safety across the entire feature. All profile data is strongly typed.

---

### 2. **frontend/src/hooks/useUserProfile.ts**
**Purpose:** React hook for profile lifecycle management

**Key Features:**
- Automatically loads profile from localStorage on mount
- Validates profile before use
- Saves updates atomically
- Provides error handling
- Exports helper functions: `timeStringToMinutes()`, `minutesToTimeString()`

**Return Object:**
```typescript
{
  profile: UserProfile,
  updateProfile: (updates) => void,
  resetProfile: () => void,
  isLoading: boolean,
  error: string | null
}
```

**Usage Example:**
```typescript
const { profile, updateProfile } = useUserProfile()
// Update battery hours
updateProfile({ batteryBackupHours: 8 })
```

---

### 3. **frontend/src/components/ProfileSetup.tsx**
**Purpose:** Clean 5-step setup UI for first-time users

**Flow:**
1. **Step 1:** Select user type (Student / Remote Worker / Business Owner)
2. **Step 2:** Configure battery backup hours (0–24 hours slider)
3. **Step 3:** Internet backup availability (Yes/No toggle)
4. **Step 4:** Work/study hours (time inputs)
5. **Step 5:** Review & confirm all settings

**Features:**
- Modal-based, non-intrusive
- Mobile-responsive
- Uses existing lucide-react icons
- Consistent with dashboard styling
- No new dependencies

**Props:**
```typescript
interface ProfileSetupProps {
  onComplete: (userType, batteryHours, internetBackup, workHours) => void
  onSkip?: () => void
}
```

---

### 4. **frontend/src/hooks/useImpactAnalyzer.ts**
**Purpose:** AI-powered risk analysis that uses the user profile

**Analyzes:**
- Work hour conflicts with outages
- Battery backup adequacy
- Internet backup needs
- User role impact

**Returns:**
```typescript
interface ImpactAnalysis {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  riskScore: 0-100
  reason: string
  explanation: string
  recommendations: string[]
  factors: {
    workHourConflict: { score, detail }
    batteryAdequacy: { score, detail }
    internetBackupNeed: { score, detail }
    userTypeImpact: { score, detail }
  }
}
```

**Scoring Logic:**
- Each factor contributes to overall risk
- Score is averaged: `(factor1 + factor2 + factor3 + factor4) / 4`
- Risk levels: 0–25 (Low), 26–49 (Medium), 50–74 (High), 75+ (Critical)

**Example:**
```typescript
const analysis = useImpactAnalyzer(profile, outages, outageCount, totalOutageMins)
// { riskLevel: 'High', riskScore: 72, reason: '...', recommendations: [...] }
```

---

### 5. **frontend/src/components/ImpactCard.tsx**
**Purpose:** Display the impact analysis in a collapsible card

**Features:**
- Color-coded risk indicator (🔴 🟠 🟡 🟢)
- Expandable/collapsible for more details
- Shows factor breakdown with scores
- Lists actionable recommendations
- Risk explanation

**Props:**
```typescript
interface ImpactCardProps {
  analysis: ImpactAnalysis | null
  isLoading?: boolean
  isExpanded?: boolean
  onToggleExpand?: (expanded: boolean) => void
}
```

---

## Integration Points

### Where to Integrate in Dashboard.tsx

**1. Add imports:**
```typescript
import { useUserProfile } from './hooks/useUserProfile'
import { useImpactAnalyzer } from './hooks/useImpactAnalyzer'
import ProfileSetup from './components/ProfileSetup'
import ImpactCard from './components/ImpactCard'
```

**2. Initialize hooks in Dashboard component:**
```typescript
const { profile, updateProfile } = useUserProfile()
const [showProfileSetup, setShowProfileSetup] = useState(false)

const analysis = useImpactAnalyzer(
  profile,
  outages.map(o => ({ start: o.start, end: o.end, label: o.label })),
  outages.length,
  outages.reduce((a, o) => a + (o.end - o.start), 0)
)
```

**3. Show setup modal on first use:**
```typescript
// In useEffect during init
if (!userProfile && !hasSeenSetup) {
  setShowProfileSetup(true)
}
```

**4. Render ProfileSetup:**
```typescript
{showProfileSetup && (
  <ProfileSetup
    onComplete={(userType, batteryHours, internetBackup, workHours) => {
      updateProfile({ userType, batteryBackupHours: batteryHours, internetBackup, workHours })
      setShowProfileSetup(false)
    }}
    onSkip={() => setShowProfileSetup(false)}
  />
)}
```

**5. Display impact card:**
```typescript
<ImpactCard
  analysis={analysis}
  isExpanded={false}
  onToggleExpand={(exp) => setImpactCardExpanded(exp)}
/>
```

---

## Data Flow

```
┌─────────────────────────────────────────────────┐
│ User First Visit                                │
├─────────────────────────────────────────────────┤
│  → Check localStorage for profile              │
│  → Not found → Show ProfileSetup modal          │
│  → User fills 5 steps                           │
│  → Save to localStorage + state                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Profile Loaded                                  │
├─────────────────────────────────────────────────┤
│  Profile { userType, batteryHours,             │
│           internetBackup, workHours }           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ useImpactAnalyzer Hook                          │
├─────────────────────────────────────────────────┤
│  Input: Profile + Outages                      │
│  → Detect conflicts                            │
│  → Calculate risk score                        │
│  → Generate recommendations                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ ImpactCard Component                            │
├─────────────────────────────────────────────────┤
│  Shows: Risk level, score, breakdown,          │
│         explanation, recommendations            │
└─────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. **localStorage for Persistence**
- ✅ Works offline
- ✅ No backend required
- ✅ Instant load on return visits
- ✅ Per-browser storage (privacy-friendly)

### 2. **Validation on Load**
- Checks profile structure before using it
- Falls back to defaults if corrupted
- Prevents app crashes from bad data

### 3. **Minimal Dependencies**
- Only uses React built-ins
- Reuses existing lucide-react icons
- No new npm packages needed
- Keeps bundle size small

### 4. **Memoization in useImpactAnalyzer**
- `useMemo()` prevents unnecessary recalculations
- Only recalculates when inputs change
- Improves performance

### 5. **Modular Components**
- ProfileSetup is independent modal
- ImpactCard is display-only
- useImpactAnalyzer is pure logic
- Easy to test and reuse

---

## Testing Checklist

- [ ] ProfileSetup modal appears for new users
- [ ] Can navigate through all 5 steps
- [ ] Profile saves to localStorage
- [ ] Profile loads on page refresh
- [ ] useImpactAnalyzer calculates correct risk scores
- [ ] ImpactCard displays analysis properly
- [ ] Recommendations are personalized by user type
- [ ] Battery backup validation works
- [ ] Work hour conflicts detected correctly
- [ ] Edge cases: no outages, all-day outages, etc.

---

## Next Steps

After Feature 1 is complete:

### Feature 2: AI Impact Analyzer (Uses Feature 1)
- Uses `useImpactAnalyzer` hook
- Integrated with ImpactCard display
- Backend API for risk scoring (optional)

### Feature 3: AI Chat Assistant (Uses Features 1 & 2)
- References user profile for context
- Uses impact score to personalize responses
- Answers questions about outages & preparation

---

## Production Checklist

- [ ] Add JSDoc comments for all exports
- [ ] Test on mobile devices
- [ ] Verify localStorage quota usage (< 5MB)
- [ ] Test with various time zones
- [ ] Add error boundary around ProfileSetup
- [ ] Internationalize strings (i18n ready)
- [ ] Performance: test with many outages

---

## Estimated Time to Integrate

- **Setup:** ~5 minutes
- **Testing:** ~15 minutes
- **Total:** ~20 minutes

No Breaking Changes! Can be integrated incrementally.
