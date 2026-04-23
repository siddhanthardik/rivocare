import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';

// Patient Screens
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import PatientBookingScreen from '../screens/patient/PatientBookingScreen';
import PatientHistoryScreen from '../screens/patient/PatientHistoryScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';

// Provider Screens
import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ProviderRequestsScreen from '../screens/provider/ProviderRequestsScreen';
import SettingsDetailScreen from '../screens/shared/SettingsDetailScreen';
import BookingDetailsScreen from '../screens/shared/BookingDetailsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const buildTabScreenOptions = (insets) => ({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        if (route.name === 'Home') return <Ionicons name="home-outline" color={color} size={size} />;
        if (route.name === 'History') return <Ionicons name="list-outline" color={color} size={size} />;
        if (route.name === 'Dashboard') return <Ionicons name="grid-outline" color={color} size={size} />;
        if (route.name === 'Requests') return <Ionicons name="list-outline" color={color} size={size} />;
        if (route.name === 'Profile') return <Ionicons name="person-outline" color={color} size={size} />;
        return <Ionicons name="pulse-outline" color={color} size={size} />;
      },
      tabBarActiveTintColor: '#10b981',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarHideOnKeyboard: true,
      headerShown: false,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: insets.bottom > 0 ? 0 : 4,
      },
      tabBarStyle: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom > 0 ? 8 : 16,
        height: 72 + Math.max(insets.bottom - 4, 0),
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 10,
        borderTopWidth: 0,
        borderRadius: 24,
        elevation: 12,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        backgroundColor: '#ffffff',
      },
      sceneStyle: {
        backgroundColor: '#f5f7fb',
      },
    });

const PatientTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={buildTabScreenOptions(insets)}
    >
      <Tab.Screen 
        name="Home" 
        component={PatientHomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="History"
        component={PatientHistoryScreen}
        options={{ title: 'Bookings' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const PatientNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={PatientTabs} />
    <Stack.Screen name="Booking" component={PatientBookingScreen} options={{ presentation: 'modal' }} />
    <Stack.Screen name="SettingsDetail" component={SettingsDetailScreen} />
    <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
  </Stack.Navigator>
);

const ProviderTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={buildTabScreenOptions(insets)}
    >
      <Tab.Screen
        name="Dashboard"
        component={ProviderDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Requests"
        component={ProviderRequestsScreen}
        options={{ title: 'Requests' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const ProviderNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProviderMainTabs" component={ProviderTabs} />
    <Stack.Screen name="SettingsDetail" component={SettingsDetailScreen} />
    <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
  </Stack.Navigator>
);

export default function AppNavigator() {
  const { isAuthenticated, isProvider, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : isProvider ? (
        <ProviderNavigator />
      ) : (
        <PatientNavigator />
      )}
    </NavigationContainer>
  );
}
