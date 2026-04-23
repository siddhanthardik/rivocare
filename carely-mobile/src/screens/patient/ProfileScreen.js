import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';

const MENU_ITEMS = [
  {
    key: 'account',
    icon: 'settings-outline',
    label: 'Account Settings',
    bgColor: '#ecfdf5',
    iconColor: '#10b981',
  },
  {
    key: 'notifications',
    icon: 'notifications-outline',
    label: 'Notification Preferences',
    bgColor: '#dbeafe',
    iconColor: '#3b82f6',
  },
  {
    key: 'privacy',
    icon: 'shield-checkmark-outline',
    label: 'Privacy & Security',
    bgColor: '#fef3c7',
    iconColor: '#f59e0b',
  },
  {
    key: 'support',
    icon: 'help-circle-outline',
    label: 'Help & Support',
    bgColor: '#f3e8ff',
    iconColor: '#a855f7',
  },
  {
    key: 'terms',
    icon: 'document-text-outline',
    label: 'Terms & Conditions',
    bgColor: '#fee2e2',
    iconColor: '#ef4444',
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activePanel, setActivePanel] = useState('');
  const [preferences, setPreferences] = useState({
    booking: true,
    payment: true,
    tips: false,
  });

  const panelTitle = useMemo(() => {
    return MENU_ITEMS.find((item) => item.key === activePanel)?.label || '';
  }, [activePanel]);

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

  const renderPanelContent = () => {
    if (activePanel === 'account') {
      return (
        <View style={styles.panelBlock}>
          <Text style={styles.panelBody}>
            Your primary account details are shown below. Profile editing controls can be added next if you want us to build a full account settings flow.
          </Text>
          <View style={styles.detailStack}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Full name</Text>
              <Text style={styles.detailValue}>{user?.name || 'Not set'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user?.email || 'Not set'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{user?.phone || 'Not set'}</Text>
            </View>
          </View>
        </View>
      );
    }

    if (activePanel === 'notifications') {
      return (
        <View style={styles.panelBlock}>
          <Text style={styles.panelBody}>
            Choose how RIVO should notify you about bookings, payment reminders, and helpful care updates.
          </Text>
          {[
            { key: 'booking', label: 'Booking updates' },
            { key: 'payment', label: 'Payment reminders' },
            { key: 'tips', label: 'Care tips and offers' },
          ].map((item) => (
            <View key={item.key} style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>{item.label}</Text>
              <Switch
                value={preferences[item.key]}
                onValueChange={(value) =>
                  setPreferences((current) => ({ ...current, [item.key]: value }))
                }
                trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                thumbColor={preferences[item.key] ? '#10b981' : '#ffffff'}
              />
            </View>
          ))}
        </View>
      );
    }

    if (activePanel === 'privacy') {
      return (
        <View style={styles.panelBlock}>
          <Text style={styles.panelBody}>
            Your bookings and account details are protected with authenticated access. Use a strong password and avoid sharing login credentials with anyone else.
          </Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Recommended</Text>
            <Text style={styles.tipText}>Review active sessions regularly and keep your device lock enabled.</Text>
          </View>
        </View>
      );
    }

    if (activePanel === 'support') {
      return (
        <View style={styles.panelBlock}>
          <Text style={styles.panelBody}>
            Need help with a booking, payment, or provider issue? Reach the support team and we will guide you.
          </Text>
          <View style={styles.detailStack}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>support@rivocare.in</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hours</Text>
              <Text style={styles.detailValue}>Mon-Sat | 9:00 AM - 7:00 PM</Text>
            </View>
          </View>
        </View>
      );
    }

    if (activePanel === 'terms') {
      return (
        <View style={styles.panelBlock}>
          <Text style={styles.panelBody}>
            By using RIVO, you agree to our service terms, payment policies, and cancellation rules. Bookings can only be paid after provider confirmation, and in-progress cancellations may carry service charges.
          </Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Important</Text>
            <Text style={styles.tipText}>Please review booking details carefully before confirming service and payment.</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 14, paddingBottom: 150 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>RIVO ACCOUNT</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBg}>
              <Ionicons name="person-circle" size={82} color="#10b981" />
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userRole}>
              {user?.role === 'patient' ? 'Patient account' : 'Service provider'}
            </Text>
            <Text style={styles.userEmail}>{user?.email || 'N/A'}</Text>
          </View>
        </Card>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Card>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="call-outline" size={18} color="#3b82f6" />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user?.phone || 'Not added'}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="location-outline" size={18} color="#10b981" />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{user?.pincode || 'Not added'}</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => setActivePanel(item.key)}
            >
              <View style={[styles.menuIconBg, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
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
            You will need to log in again to access your account
          </Text>
        </View>
      </ScrollView>

      <Modal visible={!!activePanel} transparent animationType="fade" onRequestClose={() => setActivePanel('')}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>SETTINGS</Text>
                <Text style={styles.modalTitle}>{panelTitle}</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setActivePanel('')} activeOpacity={0.85}>
                <Ionicons name="close" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {renderPanelContent()}

            <Button
              title="Done"
              onPress={() => setActivePanel('')}
              size="medium"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 16,
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
  },
  heroCard: {
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  avatarBg: {
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
  infoSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoIconBg: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCopy: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '800',
  },
  menuSection: {
    marginBottom: 16,
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
  menuLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  logoutSection: {
    marginTop: 12,
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modalEyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  panelBlock: {
    marginBottom: 20,
  },
  panelBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748b',
    marginBottom: 16,
  },
  detailStack: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  tipCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
});
