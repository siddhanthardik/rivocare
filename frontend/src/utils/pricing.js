export const HYBRID_PRICING = {
  physiotherapist: {
    hasLevels: true,
    levels: [
      { id: 'basic', label: 'Basic Rehab', multiplier: 1, desc: 'General mobility and pain relief' },
      { id: 'standard', label: 'Standard Rehab', multiplier: 1.2, desc: 'Condition-specific therapy' },
      { id: 'advanced', label: 'Advanced / Post-Surgery', multiplier: 1.5, desc: 'Intensive recovery program' }
    ],
    hasPacks: true,
    packs: [
      { id: '1_session', label: '1 Session', durationHours: 1, discount: 0 },
      { id: '5_sessions', label: '5 Sessions Pack', durationHours: 5, discount: 0.10 },
      { id: '10_sessions', label: '10 Sessions Pack', durationHours: 10, discount: 0.15 }
    ]
  },
  nurse: {
    hasShifts: true,
    shifts: [
      { id: '12h_day', label: '12h Day Shift', durationHours: 12, desc: '8 AM - 8 PM' },
      { id: '12h_night', label: '12h Night Shift', durationHours: 12, desc: '8 PM - 8 AM' },
      { id: '24h_live_in', label: '24h Live-in', durationHours: 24, desc: 'Round the clock care' }
    ],
    hasDurations: true,
    durations: [
      { id: '1_day', label: '1 Day', multiplier: 1, discount: 0 },
      { id: '1_week', label: '1 Week', multiplier: 7, discount: 0.10 },
      { id: '1_month', label: '1 Month', multiplier: 30, discount: 0.20 }
    ]
  },
  doctor: {
    hasConditions: true,
    conditions: [
      { id: 'gp', label: 'General Physician', type: 'GP', desc: 'Fever, Cold, General checkup', multiplier: 1 },
      { id: 'specialist_ortho', label: 'Orthopedics', type: 'Specialist', desc: 'Bone & Joint pain', multiplier: 1.5 },
      { id: 'specialist_cardio', label: 'Cardiology', type: 'Specialist', desc: 'Heart & BP issues', multiplier: 2.0 },
      { id: 'specialist_neuro', label: 'Neurology', type: 'Specialist', desc: 'Brain & Nerve issues', multiplier: 2.0 }
    ]
  },
  procedure: {
    isFixed: true,
    actions: [
      { id: 'injection_iv', label: 'IV Injection / Drip', durationHours: 1, multiplier: 0.5 },
      { id: 'wound_dressing', label: 'Wound Dressing', durationHours: 1, multiplier: 0.8 },
      { id: 'catheterization', label: 'Catheterization', durationHours: 1, multiplier: 1.2 }
    ]
  },
  package: {
    isFixed: true,
    bundles: [
      { id: 'elder_care_basic', label: 'Elder Care Basic', durationHours: 120, multiplier: 1, desc: 'Basic care bundle' },
      { id: 'post_surgery_rehab', label: 'Post-Surgery Rehab', durationHours: 240, multiplier: 1, desc: 'Intensive recovery bundle' }
    ]
  }
};
