import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';

const NOTIFICATION_KEY = 'rivo_notification_preferences';
const PRIVACY_KEY = 'rivo_privacy_preferences';

const DEFAULT_NOTIFICATION_SETTINGS = {
  booking: true,
  payment: true,
  tips: false,
};

const DEFAULT_PRIVACY_SETTINGS = {
  maskSensitiveInfo: true,
  deviceConfirmation: true,
  marketingPersonalization: false,
};

const SCREEN_META = {
  account: {
    eyebrow: 'ACCOUNT',
    title: 'Account Settings',
    description: 'Keep your identity, contact details, and service location accurate across the app.',
  },
  notifications: {
    eyebrow: 'NOTIFICATIONS',
    title: 'Notification Preferences',
    description: 'Choose which updates should reach you so important service events never get lost.',
  },
  privacy: {
    eyebrow: 'PRIVACY',
    title: 'Privacy & Security',
    description: 'Control how account information is shown on your device and jump straight to device settings when needed.',
  },
  support: {
    eyebrow: 'SUPPORT',
    title: 'Help & Support',
    description: 'Reach the support team quickly or review the most common service questions.',
  },
  terms: {
    eyebrow: 'TERMS',
    title: 'Terms & Conditions',
    description: 'A clear summary of the service rules, booking responsibilities, and payment expectations.',
  },
};

const FAQS = [
  {
    question: 'How do I know a provider has accepted my booking?',
    answer: 'You will see the booking move to confirmed status, and the notifications area will show a payment-required update once the provider accepts.',
  },
  {
    question: 'When should I make payment?',
    answer: 'Payment is made only after the provider confirms the booking. This keeps the workflow aligned with live availability.',
  },
  {
    question: 'Can I cancel a booking after confirmation?',
    answer: 'Yes, but cancellation timing matters. Late cancellations may affect refund eligibility depending on the booking stage.',
  },
];

const TERMS_SECTIONS = [
  {
    title: 'Booking confirmation',
    body: 'A booking becomes actionable only after a provider confirms availability. Until then, timing and price should be treated as provisional.',
  },
  {
    title: 'Payments',
    body: 'Confirmed bookings may require payment before service begins. If a provider submits a revised price, patient approval is required before payment can proceed.',
  },
  {
    title: 'Cancellations',
    body: 'Patients and providers should cancel as early as possible. Late cancellations can affect scheduling quality and may carry service charges depending on the final policy.',
  },
  {
    title: 'On-site conduct',
    body: 'Both patients and providers are expected to maintain respectful communication, accurate addresses, and safe service conditions during every visit.',
  },
];

const fieldValue = (value) => (typeof value === 'string' ? value : '');

export default function SettingsDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const screenType = route.params?.type || 'account';
  const meta = useMemo(() => SCREEN_META[screenType] || SCREEN_META.account, [screenType]);
  const [saving, setSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [privacySettings, setPrivacySettings] = useState(DEFAULT_PRIVACY_SETTINGS);
  const [faqOpen, setFaqOpen] = useState('');
  const [form, setForm] = useState({
    name: fieldValue(user?.name),
    phone: fieldValue(user?.phone),
    pincode: fieldValue(user?.pincode),
    address: fieldValue(user?.address),
  });

  useEffect(() => {
    setForm({
      name: fieldValue(user?.name),
      phone: fieldValue(user?.phone),
      pincode: fieldValue(user?.pincode),
      address: fieldValue(user?.address),
    });
  }, [user]);

  useEffect(() => {
    const loadLocalSettings = async () => {
      try {
        const [storedNotifications, storedPrivacy] = await Promise.all([
          AsyncStorage.getItem(NOTIFICATION_KEY),
          AsyncStorage.getItem(PRIVACY_KEY),
        ]);

        if (storedNotifications) {
          setNotificationSettings({
            ...DEFAULT_NOTIFICATION_SETTINGS,
            ...JSON.parse(storedNotifications),
          });
        }

        if (storedPrivacy) {
          setPrivacySettings({
            ...DEFAULT_PRIVACY_SETTINGS,
            ...JSON.parse(storedPrivacy),
          });
        }
      } catch (error) {
        console.warn('Failed to load local settings:', error.message);
      }
    };

    loadLocalSettings();
  }, []);

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }

    if (!form.phone.trim()) {
      Alert.alert('Missing phone', 'Please enter your phone number.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        pincode: form.pincode.trim(),
        address: form.address.trim(),
      });
      Alert.alert('Saved', 'Your account details have been updated.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Update failed', error.response?.data?.message || 'Unable to save your account details right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notificationSettings));
      Alert.alert('Saved', 'Your notification preferences have been updated.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Save failed', 'Unable to store notification preferences on this device.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacySettings = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(privacySettings));
      Alert.alert('Saved', 'Your privacy preferences have been updated.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Save failed', 'Unable to store privacy preferences on this device.');
    } finally {
      setSaving(false);
    }
  };

  const openLink = async (url, fallbackMessage) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }
      Alert.alert('Unavailable', fallbackMessage);
    } catch (error) {
      Alert.alert('Unavailable', fallbackMessage);
    }
  };

  const renderAccountScreen = () => (
    <>
      <Card>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
            placeholder="Enter your full name"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))}
            placeholder="Enter your phone number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pincode</Text>
          <TextInput
            style={styles.input}
            value={form.pincode}
            onChangeText={(value) => setForm((current) => ({ ...current, pincode: value }))}
            placeholder="Enter your service pincode"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.inputGroupLast}>
          <Text style={styles.inputLabel}>Address</Text>
          <TextInput
            style={[styles.input, styles.inputLarge]}
            value={form.address}
            onChangeText={(value) => setForm((current) => ({ ...current, address: value }))}
            placeholder="Flat, building, area, landmark"
            placeholderTextColor="#94a3b8"
            multiline
          />
        </View>
      </Card>

      <Button title="Save Changes" onPress={handleSaveProfile} loading={saving} />
    </>
  );

  const renderNotificationScreen = () => (
    <>
      <Card>
        {[
          { key: 'booking', label: 'Booking updates', caption: 'Receive status changes, confirmations, and service reminders.' },
          { key: 'payment', label: 'Payment reminders', caption: 'Get notified when provider confirmation requires payment.' },
          { key: 'tips', label: 'Care tips and offers', caption: 'Optional helpful content and service suggestions.' },
        ].map((item, index) => (
          <View key={item.key} style={[styles.switchRow, index === 2 && styles.switchRowLast]}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>{item.label}</Text>
              <Text style={styles.switchCaption}>{item.caption}</Text>
            </View>
            <Switch
              value={notificationSettings[item.key]}
              onValueChange={(value) =>
                setNotificationSettings((current) => ({ ...current, [item.key]: value }))
              }
              trackColor={{ false: '#cbd5e1', true: '#86efac' }}
              thumbColor={notificationSettings[item.key] ? '#10b981' : '#ffffff'}
            />
          </View>
        ))}
      </Card>

      <Button title="Save Preferences" onPress={handleSaveNotificationSettings} loading={saving} />
    </>
  );

  const renderPrivacyScreen = () => (
    <>
      <Card>
        {[
          { key: 'maskSensitiveInfo', label: 'Mask sensitive profile info', caption: 'Reduce casual visibility of your saved contact details on-screen.' },
          { key: 'deviceConfirmation', label: 'Confirm important actions', caption: 'Ask for an extra confirmation before sensitive actions like logout or updates.' },
          { key: 'marketingPersonalization', label: 'Personalized recommendations', caption: 'Allow the app to tailor service suggestions on this device.' },
        ].map((item, index) => (
          <View key={item.key} style={[styles.switchRow, index === 2 && styles.switchRowLast]}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>{item.label}</Text>
              <Text style={styles.switchCaption}>{item.caption}</Text>
            </View>
            <Switch
              value={privacySettings[item.key]}
              onValueChange={(value) =>
                setPrivacySettings((current) => ({ ...current, [item.key]: value }))
              }
              trackColor={{ false: '#cbd5e1', true: '#86efac' }}
              thumbColor={privacySettings[item.key] ? '#10b981' : '#ffffff'}
            />
          </View>
        ))}
      </Card>

      <Card style={styles.inlineCard}>
        <Text style={styles.inlineCardTitle}>Device controls</Text>
        <Text style={styles.inlineCardBody}>
          Open device settings if you want to review permissions, notifications, or operating-system privacy controls.
        </Text>
        <Button
          title="Open Device Settings"
          icon="settings-outline"
          variant="secondary"
          onPress={() => Linking.openSettings()}
        />
      </Card>

      <Button title="Save Privacy Settings" onPress={handleSavePrivacySettings} loading={saving} />
    </>
  );

  const renderSupportScreen = () => (
    <>
      <Card style={styles.inlineCard}>
        <Text style={styles.inlineCardTitle}>Contact support</Text>
        <Text style={styles.inlineCardBody}>
          Reach the team directly for booking issues, payment questions, or provider coordination help.
        </Text>
        <View style={styles.supportMeta}>
          <Text style={styles.supportMetaLabel}>Support email</Text>
          <Text style={styles.supportMetaValue}>support@rivocare.in</Text>
        </View>
        <View style={styles.supportMetaLast}>
          <Text style={styles.supportMetaLabel}>Hours</Text>
          <Text style={styles.supportMetaValue}>Monday to Saturday, 9:00 AM to 7:00 PM</Text>
        </View>
        <Button
          title="Email Support"
          icon="mail-outline"
          onPress={() => openLink('mailto:support@rivocare.in?subject=RIVO%20Support', 'Email is not configured on this device.')}
        />
      </Card>

      <Card>
        <Text style={styles.inlineCardTitle}>Frequently asked questions</Text>
        {FAQS.map((item) => {
          const expanded = faqOpen === item.question;
          return (
            <TouchableOpacity
              key={item.question}
              style={styles.faqItem}
              activeOpacity={0.88}
              onPress={() => setFaqOpen((current) => (current === item.question ? '' : item.question))}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons name={expanded ? 'remove' : 'add'} size={18} color="#10b981" />
              </View>
              {expanded ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </Card>
    </>
  );

  const renderTermsScreen = () => (
    <Card>
      {TERMS_SECTIONS.map((section, index) => (
        <View key={section.title} style={[styles.termBlock, index === TERMS_SECTIONS.length - 1 && styles.termBlockLast]}>
          <Text style={styles.termTitle}>{section.title}</Text>
          <Text style={styles.termBody}>{section.body}</Text>
        </View>
      ))}
    </Card>
  );

  const renderContent = () => {
    if (screenType === 'account') return renderAccountScreen();
    if (screenType === 'notifications') return renderNotificationScreen();
    if (screenType === 'privacy') return renderPrivacyScreen();
    if (screenType === 'support') return renderSupportScreen();
    return renderTermsScreen();
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 18,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 32,
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.88}>
              <Ionicons name="arrow-back" size={20} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{meta.eyebrow}</Text>
              <Text style={styles.title}>{meta.title}</Text>
              <Text style={styles.description}>{meta.description}</Text>
            </View>
          </View>

          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 14,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupLast: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe4ee',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  inputLarge: {
    minHeight: 110,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  switchRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  switchCopy: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  switchCaption: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
  inlineCard: {
    marginBottom: 16,
  },
  inlineCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  inlineCardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
  supportMeta: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  supportMetaLast: {
    marginBottom: 14,
  },
  supportMetaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
  },
  supportMetaValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  faqItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  faqAnswer: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
  },
  termBlock: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  termBlockLast: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },
  termTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  termBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
  },
});
