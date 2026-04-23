import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';

const buildMenuItems = (role) => [
  {
    key: 'account',
    icon: 'settings-outline',
    label: 'Account Settings',
    caption: 'Update name, phone, pincode, and address',
    bgColor: '#ecfdf5',
    iconColor: '#10b981',
  },
  {
    key: 'notifications',
    icon: 'notifications-outline',
    label: 'Notification Preferences',
    caption: 'Control booking and payment alerts on this device',
    bgColor: '#dbeafe',
    iconColor: '#3b82f6',
  },
  {
    key: 'privacy',
    icon: 'shield-checkmark-outline',
    label: 'Privacy & Security',
    caption: 'Review privacy controls and open device settings',
    bgColor: '#fef3c7',
    iconColor: '#f59e0b',
  },
  {
    key: 'support',
    icon: 'help-circle-outline',
    label: 'Help & Support',
    caption: role === 'provider' ? 'Get help with requests, availability, and payouts' : 'Get help with bookings, payments, and care support',
    bgColor: '#f3e8ff',
    iconColor: '#a855f7',
  },
  {
    key: 'terms',
    icon: 'document-text-outline',
    label: 'Terms & Conditions',
    caption: 'Review service rules and booking expectations',
    bgColor: '#fee2e2',
    iconColor: '#ef4444',
  },
];

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, isProvider } = useAuth();
  const [loading, setLoading] = useState(false);
  const menuItems = useMemo(() => buildMenuItems(user?.role), [user?.role]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: 20,
          paddingBottom: 150 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{isProvider ? 'PROVIDER PROFILE' : 'RIVO ACCOUNT'}</Text>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>
            Keep your account polished and your service settings easy to reach.
          </Text>
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBadge}>
              <Ionicons name={isProvider ? 'medkit-outline' : 'person-circle-outline'} size={34} color="#10b981" />
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userRole}>
              {isProvider ? 'Service provider account' : 'Patient account'}
            </Text>
            <Text style={styles.userEmail}>{user?.email || 'N/A'}</Text>
          </View>
        </Card>

        <View style={styles.infoGrid}>
          <Card style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="call-outline" size={18} color="#3b82f6" />
            </View>
            <Text style={styles.infoTitle}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Not added'}</Text>
          </Card>

          <Card style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="location-outline" size={18} color="#10b981" />
            </View>
            <Text style={styles.infoTitle}>Pincode</Text>
            <Text style={styles.infoValue}>{user?.pincode || 'Not added'}</Text>
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('SettingsDetail', { type: item.key })}
            >
              <View style={[styles.menuIconBg, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>

              <View style={styles.menuCopy}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuCaption}>{item.caption}</Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.logoutSection}>
          <Button
            title="Logout"
            icon="log-out-outline"
            onPress={handleLogout}
            loading={loading}
            disabled={loading}
            variant="danger"
            size="large"
            style={styles.logoutButton}
          />
          <Text style={styles.cautionText}>
            You will need to log in again to access your account.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },
  heroCard: {
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarBadge: {
    width: 76,
    height: 76,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    marginBottom: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  infoIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    marginBottom: 12,
  },
  menuIconBg: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCopy: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  menuCaption: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
  },
  logoutSection: {
    marginTop: 10,
  },
  logoutButton: {
    marginBottom: 12,
  },
  cautionText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },
});
