# RIVO Mobile Application - Developer Guide

## Project Overview
RIVO is a healthcare mobile application built with React Native and Expo, providing service booking and provider management for healthcare services.

## Quick Start

```bash
cd d:\carely\carely-mobile
npm install
npx expo start
```

## Project Structure

```
rivo-mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.js        # Button component (variants: primary, secondary, danger)
│   │   ├── Card.js          # Card component (variants: default, outlined, elevated)
│   │   ├── Header.js        # Screen header component
│   │   └── EmptyState.js    # Empty state display with optional CTA
│   │
│   ├── screens/             # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── SignupScreen.js
│   │   ├── patient/
│   │   │   ├── PatientHomeScreen.js      # Main patient dashboard
│   │   │   ├── PatientBookingScreen.js   # Multi-step booking flow
│   │   │   ├── PatientHistoryScreen.js   # Booking history with tabs
│   │   │   └── ProfileScreen.js          # Patient profile & settings
│   │   └── provider/
│   │       ├── ProviderDashboardScreen.js   # Provider main dashboard
│   │       └── ProviderRequestsScreen.js    # Incoming service requests
│   │
│   ├── navigation/
│   │   ├── AppNavigator.js      # Main navigator (Stack + Tabs)
│   │   └── AuthNavigator.js     # Auth flow navigator
│   │
│   ├── context/
│   │   └── AuthContext.js       # Global authentication state
│   │
│   ├── api/
│   │   └── index.js             # API client with axios & interceptors
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── (useAuth, useApi, etc.)
│   │
│   ├── utils/                   # Utility functions
│   │
│   └── constants/               # App constants
│       ├── routes.js
│       ├── colors.js
│       └── specialties.js
│
├── App.js                       # Root component
├── index.js                     # App entry point
├── app.json                     # Expo configuration
└── package.json                 # Dependencies

```

## Key Components

### 1. Button Component
```jsx
<Button
  title="Book Now"
  onPress={handleBook}
  variant="primary"        // 'primary' | 'secondary' | 'danger'
  size="large"             // 'small' | 'medium' | 'large'
  icon="arrow-forward"     // Ionicons name
  loading={isLoading}
  disabled={false}
/>
```

### 2. Card Component
```jsx
<Card 
  variant="default"        // 'default' | 'outlined' | 'elevated'
  pressable={true}
  onPress={handlePress}
>
  <Text>Card content</Text>
</Card>
```

### 3. Header Component
```jsx
<Header
  title="My Profile"
  subtitle="Edit your info"
  onBackPress={() => navigation.goBack()}
  showBackButton={true}
  rightIcon="edit-2"
  onRightPress={handleEdit}
/>
```

## Screen Features

### Patient Screens
| Screen | Features | Route |
|--------|----------|-------|
| Home | Service listing, quick stats, search | `patient/home` |
| Booking | 4-step wizard + confirmation | `patient/booking` |
| History | Bookings with tabs (All/Upcoming/Completed) | `patient/history` |
| Profile | User info, settings, logout | `patient/profile` |

### Provider Screens
| Screen | Features | Route |
|--------|----------|-------|
| Dashboard | Status toggle, stats, requests preview | `provider/dashboard` |
| Requests | Full request list with actions | `provider/requests` |

## Navigation Structure

```
AppNavigator
├── Patient Flow
│   ├── PatientTabs
│   │   ├── Home
│   │   ├── History
│   │   └── Profile
│   └── Booking (Modal)
│
├── Provider Flow
│   ├── ProviderTabs
│   │   ├── Dashboard
│   │   ├── Requests
│   │   └── Profile
│   └── (modal screens)
│
└── Auth Flow (when unauthenticated)
    ├── Login
    ├── Signup
    └── ForgotPassword

```

## API Integration

### API Service Pattern
```js
// services/appointments.js
export const appointmentService = {
  create: (data) => api.post('/appointments', data),
  getAll: (params) => api.get('/appointments', { params }),
  update: (id, data) => api.patch(`/appointments/${id}`, data),
};

// hooks/useAppointments.js
export const useAppointments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    appointmentService.getAll()
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);
  
  return { data, loading };
};

// In component
const { data } = useAppointments();
```

## State Management

### Authentication Context
```js
const { 
  user,               // Current user object
  isAuthenticated,    // Boolean
  login,              // (userData, token) => void
  logout,             // () => void
  isProvider,         // Boolean - user.role === 'provider'
  providerProfile,    // Provider data if user is provider
} = useAuth();
```

## Color Scheme

```js
const colors = {
  primary: '#10b981',      // Emerald green
  secondary: '#3b82f6',    // Blue
  danger: '#ef4444',       // Red
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Amber
  
  bg: {
    primary: '#f8fafc',    // Very light gray
    secondary: '#fff',     // White
  },
  
  text: {
    primary: '#0f172a',    // Dark navy
    secondary: '#64748b',  // Gray
    muted: '#94a3b8',      // Light gray
  },
};
```

## Styling Guidelines

### Spacing
- Padding: 16px (standard), 24px (sections)
- Margins: 12px (between elements), 20px (sections)
- Gap: 8px (tight), 12px (standard), 16px (loose)

### Border Radius
- Cards: 12-16px
- Buttons: 10-12px
- Icons: 8-10px

### Shadows
- Elevation: 1-3 (subtle)
- Shadow color: Semi-transparent black
- Offset: { width: 0, height: 2 } (standard)

### Typography
```js
const typography = {
  h1: { fontSize: 32, fontWeight: '800' },    // Page title
  h2: { fontSize: 24, fontWeight: '800' },    // Section title
  h3: { fontSize: 18, fontWeight: '700' },    // Subsection
  body: { fontSize: 14-15, fontWeight: '500' }, // Regular text
  label: { fontSize: 12-13, fontWeight: '600' }, // Labels
  caption: { fontSize: 11-12, fontWeight: '500' }, // Captions
};
```

## Common Patterns

### Loading State
```jsx
if (loading) {
  return <ActivityIndicator size="large" color="#10b981" />;
}
```

### Empty State
```jsx
<EmptyState
  icon="inbox-outline"
  title="No Bookings"
  description="You haven't made any bookings yet"
  actionText="Book Now"
  onAction={handleBooking}
/>
```

### Error Handling
```jsx
try {
  const res = await api.get('/data');
  setData(res.data);
} catch (err) {
  Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
}
```

### Form Validation
```jsx
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateForm = () => {
  if (!form.email.trim()) return 'Email required';
  if (!validateEmail(form.email)) return 'Invalid email';
  if (!form.password) return 'Password required';
  return null;
};
```

## Performance Tips

1. **List Rendering**: Always use FlatList with keyExtractor
2. **Image Loading**: Implement proper caching strategies
3. **API Calls**: Use React Query or SWR for caching
4. **Re-renders**: Use useMemo and useCallback for expensive operations
5. **Navigation**: Lightweight stack navigation

## Testing Checklist

- [ ] All screens render without errors
- [ ] Navigation flows work properly
- [ ] Form validation works
- [ ] API calls handle errors gracefully
- [ ] Loading states display correctly
- [ ] Empty states appear when needed
- [ ] Buttons are responsive (onPress fires)
- [ ] Tab filtering works
- [ ] Back button navigation works
- [ ] Logout functionality works
- [ ] Pull-to-refresh works

## Debugging Tips

```bash
# Clear cache
rm -r .expo/cache
npx expo start -c

# Check logs
npx expo start --localhost

# Monitor network requests
# Enable Chrome DevTools: Ctrl+M (Android) or Cmd+D (iOS)
```

## Build & Deploy

```bash
# Web
npm run web

# Android Emulator
npm run android

# iOS Simulator
npm run ios

# Build for release
eas build --platform ios --build-type release
```

## Common Issues & Solutions

### Issue: "Invariant Violation: No native module"
**Solution**: Clear node_modules and reinstall
```bash
rm -r node_modules package-lock.json
npm install --legacy-peer-deps
```

### Issue: "TypeError: undefined is not a function"
**Solution**: Check if component is properly imported and exported

### Issue: "Navigation error - route not found"
**Solution**: Verify route name in navigation configuration

## Contact & Support

For development support or questions, refer to:
- React Native Docs: https://reactnative.dev
- Expo Docs: https://docs.expo.dev
- React Navigation: https://reactnavigation.org
