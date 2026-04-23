import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingService, providerService } from '../../api';
import {
  formatDateDDMMYYYY,
  formatScheduleWindow,
  parseDateAndTimeToISO,
} from '../../utils/dateTime';

const SERVICES = [
  { id: 'nurse', title: 'Home Nurse', icon: 'heart-outline', accent: '#0f766e', glow: '#ccfbf1' },
  { id: 'physiotherapist', title: 'Physiotherapist', icon: 'pulse-outline', accent: '#4338ca', glow: '#e0e7ff' },
  { id: 'doctor', title: 'Doctor Consult', icon: 'medkit-outline', accent: '#b45309', glow: '#fef3c7' },
  { id: 'caretaker', title: 'Trained Caretaker', icon: 'person-add-outline', accent: '#be185d', glow: '#fce7f3' },
];

const DURATION_OPTIONS = [1, 2, 4, 8, 12];
const TIME_OPTIONS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatProviderMeta = (provider) => {
  const parts = [];

  if (typeof provider.pricePerHour === 'number') {
    parts.push(`Rs ${provider.pricePerHour}/hr`);
  }

  if (typeof provider.rating === 'number' && provider.rating > 0) {
    parts.push(`${provider.rating.toFixed(1)} rating`);
  }

  if (typeof provider.experience === 'number' && provider.experience > 0) {
    parts.push(`${provider.experience} yrs exp`);
  }

  return parts.join(' | ') || 'Verified and available';
};

const startOfToday = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const parseDisplayDate = (value) => {
  const [day, month, year] = value.split('-').map(Number);

  if (!day || !month || !year) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildCalendarMatrix = (monthCursor) => {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }

  return rows;
};

export default function PatientBookingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const initialService = route.params?.service || 'nurse';
  const initialMonth = parseDisplayDate(route.params?.appointmentDate || '') || new Date();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
  );
  const [form, setForm] = useState({
    service: initialService,
    address: '',
    pincode: '',
    providerId: '',
    appointmentDate: '',
    appointmentTime: '09:00',
    durationHours: '1',
    notes: '',
  });

  const selectedService = useMemo(
    () => SERVICES.find((service) => service.id === form.service),
    [form.service]
  );
  const selectedProvider = useMemo(
    () => providers.find((provider) => provider._id === form.providerId),
    [providers, form.providerId]
  );

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCalendar = () => {
    const currentDate = parseDisplayDate(form.appointmentDate) || new Date();
    setCalendarMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    setShowCalendar(true);
  };

  const loadProviders = async () => {
    setProviderLoading(true);
    try {
      await bookingService.checkPincode(form.pincode.trim());
      const response = await providerService.getProviders({
        service: form.service,
        pincode: form.pincode.trim(),
      });
      const availableProviders = response.data?.data?.providers || [];
      setProviders(availableProviders);

      if (!availableProviders.length) {
        Alert.alert(
          'No providers available',
          'No verified online providers are serving this pincode for the selected service yet.'
        );
        return false;
      }

      return true;
    } catch (error) {
      Alert.alert(
        'Availability check failed',
        error.response?.data?.message || 'We could not verify serviceability for this pincode.'
      );
      return false;
    } finally {
      setProviderLoading(false);
    }
  };

  const validateStep = async () => {
    if (step === 1 && !form.service) {
      Alert.alert('Validation', 'Please select a service.');
      return false;
    }

    if (step === 2) {
      if (!form.address.trim() || form.pincode.trim().length !== 6) {
        Alert.alert('Validation', 'Please enter a full address and a 6-digit pincode.');
        return false;
      }

      return loadProviders();
    }

    if (step === 3 && !form.providerId) {
      Alert.alert('Validation', 'Please choose a provider before continuing.');
      return false;
    }

    if (step === 4) {
      if (!form.appointmentDate.trim() || !form.appointmentTime.trim()) {
        Alert.alert('Validation', 'Please choose both the appointment date and time.');
        return false;
      }

      if (!parseDateAndTimeToISO(form.appointmentDate.trim(), form.appointmentTime.trim())) {
        Alert.alert('Validation', 'Please use a valid date and time.');
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid && step < 4) {
      setStep((current) => current + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((current) => current - 1);
    }
  };

  const handleSubmit = async () => {
    const scheduledAt = parseDateAndTimeToISO(form.appointmentDate.trim(), form.appointmentTime.trim());

    if (!scheduledAt || !form.providerId) {
      Alert.alert('Validation', 'Please complete the booking details before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        providerId: form.providerId,
        service: form.service,
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        scheduledAt,
        durationHours: Number(form.durationHours) || 1,
        notes: form.notes.trim(),
      };

      const response = await bookingService.create(payload);
      const booking = response.data?.data?.booking;

      if (response.data?.success && booking) {
        setCreatedBooking(booking);
        setStep(5);
        return;
      }

      Alert.alert('Booking Failed', 'The server did not return the created booking.');
    } catch (error) {
      Alert.alert(
        'Booking Failed',
        error.response?.data?.message || 'Something went wrong while creating the booking.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCalendarModal = () => {
    const matrix = buildCalendarMatrix(calendarMonth);
    const selectedDate = parseDisplayDate(form.appointmentDate);
    const today = startOfToday();

    return (
      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarSheet}>
            <View style={styles.calendarHeader}>
              <View>
                <Text style={styles.calendarEyebrow}>SELECT DATE</Text>
                <Text style={styles.calendarTitle}>
                  {MONTH_LABELS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </Text>
              </View>

              <View style={styles.calendarActions}>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={() => setCalendarMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
                  )}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chevron-back" size={18} color="#0f172a" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={() => setCalendarMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
                  )}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chevron-forward" size={18} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label) => (
                <Text key={label} style={styles.weekdayLabel}>{label}</Text>
              ))}
            </View>

            {matrix.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.calendarRow}>
                {row.map((date, cellIndex) => {
                  if (!date) {
                    return <View key={`empty-${rowIndex}-${cellIndex}`} style={styles.calendarCell} />;
                  }

                  const isDisabled = date < today;
                  const isSelected = !!selectedDate && selectedDate.toDateString() === date.toDateString();

                  return (
                    <TouchableOpacity
                      key={date.toISOString()}
                      style={[
                        styles.calendarCell,
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isDisabled && styles.dayCellDisabled,
                      ]}
                      disabled={isDisabled}
                      onPress={() => {
                        updateForm('appointmentDate', formatDateDDMMYYYY(date));
                        setShowCalendar(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.dayLabel,
                          isSelected && styles.dayLabelSelected,
                          isDisabled && styles.dayLabelDisabled,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <TouchableOpacity
              style={styles.calendarDoneButton}
              onPress={() => setShowCalendar(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.calendarDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {renderCalendarModal()}

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.85}>
          <Ionicons name="close" size={22} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerEyebrow}>BOOK CARE</Text>
          <Text style={styles.headerTitle}>Book Service</Text>
        </View>

        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>{step === 5 ? 'Done' : `${step}/4`}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            {step === 1 && 'Choose your service'}
            {step === 2 && 'Share your location'}
            {step === 3 && 'Select a trusted provider'}
            {step === 4 && 'Schedule your visit'}
            {step === 5 && 'Booking created'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {step === 1 && 'Start with the type of care you need.'}
            {step === 2 && 'We use your pincode to find available providers.'}
            {step === 3 && 'Pick the best match for your timing and budget.'}
            {step === 4 && 'Tap the calendar box to choose your appointment date.'}
            {step === 5 && 'Your provider request has been sent successfully.'}
          </Text>

          <View style={styles.progressBar}>
            {[1, 2, 3, 4].map((value) => (
              <View
                key={value}
                style={[styles.progressDot, step >= value && styles.progressDotActive]}
              />
            ))}
          </View>
        </View>

        {step === 1 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Services</Text>
            <View style={styles.serviceGrid}>
              {SERVICES.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    form.service === service.id && styles.serviceCardActive,
                  ]}
                  onPress={() => updateForm('service', service.id)}
                  activeOpacity={0.88}
                >
                  <View
                    style={[
                      styles.serviceIcon,
                      { backgroundColor: service.glow },
                      form.service === service.id && { backgroundColor: service.accent },
                    ]}
                  >
                    <Ionicons
                      name={service.icon}
                      size={28}
                      color={form.service === service.id ? '#fff' : service.accent}
                    />
                  </View>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Visit location</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <View style={[styles.inputWrapper, styles.multilineWrapper]}>
                <Ionicons name="location-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="House number, street, area, landmark"
                  placeholderTextColor="#cbd5e1"
                  multiline
                  numberOfLines={4}
                  value={form.address}
                  onChangeText={(value) => updateForm('address', value)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="400001"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChangeText={(value) => updateForm('pincode', value.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Available providers</Text>

            {providerLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#10b981" />
              </View>
            ) : (
              providers.map((provider) => {
                const isSelected = form.providerId === provider._id;

                return (
                  <TouchableOpacity
                    key={provider._id}
                    style={[styles.providerCard, isSelected && styles.providerCardActive]}
                    onPress={() => updateForm('providerId', provider._id)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.providerHeader}>
                      <View style={[styles.providerAvatar, isSelected && styles.providerAvatarActive]}>
                        <Ionicons
                          name="person-outline"
                          size={22}
                          color={isSelected ? '#fff' : '#10b981'}
                        />
                      </View>
                      <View style={styles.providerTextWrap}>
                        <Text style={styles.providerName}>{provider.user?.name || 'Provider'}</Text>
                        <Text style={styles.providerMeta}>{formatProviderMeta(provider)}</Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={isSelected ? '#10b981' : '#cbd5e1'}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {step === 4 && (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Schedule</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Appointment Date</Text>
                <TouchableOpacity style={styles.selectorField} onPress={openCalendar} activeOpacity={0.88}>
                  <View style={styles.selectorLeft}>
                    <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
                    <Text style={[styles.selectorValue, !form.appointmentDate && styles.selectorPlaceholder]}>
                      {form.appointmentDate || 'Select date'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Appointment Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {TIME_OPTIONS.map((slot) => {
                      const isSelected = form.appointmentTime === slot;

                      return (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.timeChip, isSelected && styles.timeChipActive]}
                          onPress={() => updateForm('appointmentTime', slot)}
                          activeOpacity={0.88}
                        >
                          <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duration</Text>
                <View style={styles.durationRow}>
                  {DURATION_OPTIONS.map((hours) => {
                    const isSelected = form.durationHours === String(hours);

                    return (
                      <TouchableOpacity
                        key={hours}
                        style={[styles.durationChip, isSelected && styles.durationChipActive]}
                        onPress={() => updateForm('durationHours', String(hours))}
                        activeOpacity={0.88}
                      >
                        <Text
                          style={[
                            styles.durationChipText,
                            isSelected && styles.durationChipTextActive,
                          ]}
                        >
                          {hours}h
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (optional)</Text>
                <View style={[styles.inputWrapper, styles.multilineWrapper]}>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Anything the provider should know before arriving"
                    placeholderTextColor="#cbd5e1"
                    multiline
                    numberOfLines={4}
                    value={form.notes}
                    onChangeText={(value) => updateForm('notes', value)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Booking summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service</Text>
                <Text style={styles.summaryValue}>{selectedService?.title || form.service}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Provider</Text>
                <Text style={styles.summaryValue}>{selectedProvider?.user?.name || 'Not selected'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Schedule</Text>
                <Text style={styles.summaryValue}>
                  {form.appointmentDate
                    ? formatScheduleWindow(
                        parseDateAndTimeToISO(form.appointmentDate, form.appointmentTime),
                        form.durationHours
                      )
                    : 'Select date and time'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Address</Text>
                <Text style={styles.summaryValue}>{form.address.trim()}</Text>
              </View>
            </View>
          </>
        )}

        {step === 5 && (
          <View style={styles.confirmationCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark" size={36} color="#fff" />
            </View>
            <Text style={styles.confirmationTitle}>Booking Created</Text>
            <Text style={styles.confirmationSubtitle}>
              Your request has been sent to the selected provider.
            </Text>
            <View style={styles.confirmationMeta}>
              <Text style={styles.confirmationLine}>Booking ID: {createdBooking?._id}</Text>
              <Text style={styles.confirmationLine}>Status: {createdBooking?.status}</Text>
              <Text style={styles.confirmationLine}>
                Provider: {createdBooking?.provider?.user?.name || selectedProvider?.user?.name || 'Assigned provider'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => navigation.navigate('MainTabs', { screen: 'History' })}
              activeOpacity={0.88}
            >
              <Text style={styles.successButtonText}>View My Bookings</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {step !== 5 && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.secondaryButton, step === 1 && styles.buttonDisabled]}
            onPress={handleBack}
            disabled={step === 1 || loading || providerLoading}
            activeOpacity={0.88}
          >
            <Ionicons name="chevron-back" size={18} color="#475569" />
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, (loading || providerLoading) && styles.buttonDisabled]}
            onPress={step === 4 ? handleSubmit : handleNext}
            disabled={loading || providerLoading}
            activeOpacity={0.88}
          >
            {loading || providerLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  {step === 4 ? 'Confirm Booking' : 'Continue'}
                </Text>
                {step !== 4 ? <Ionicons name="chevron-forward" size={18} color="#fff" /> : null}
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerEyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  progressPill: {
    minWidth: 54,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  progressPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroCard: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: '#0f172a',
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#cbd5e1',
    marginBottom: 18,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#1e293b',
  },
  progressDotActive: {
    backgroundColor: '#34d399',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  serviceCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe4ee',
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  multilineWrapper: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  selectorField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dbe4ee',
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  selectorPlaceholder: {
    color: '#94a3b8',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  timeChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  timeChipTextActive: {
    color: '#ffffff',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  durationChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  durationChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  durationChipTextActive: {
    color: '#ffffff',
  },
  loadingState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  providerCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 22,
    padding: 16,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  providerCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    marginRight: 12,
  },
  providerAvatarActive: {
    backgroundColor: '#10b981',
  },
  providerTextWrap: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  providerMeta: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 12,
  },
  summaryLabel: {
    width: 88,
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  summaryValue: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
    fontWeight: '700',
    color: '#0f172a',
  },
  confirmationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 18,
  },
  confirmationMeta: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    padding: 16,
    marginBottom: 18,
  },
  confirmationLine: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f766e',
    marginBottom: 8,
  },
  successButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  successButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  primaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#eef2f7',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  calendarSheet: {
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarEyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  calendarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 10,
  },
  calendarNavButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  calendarRow: {
    flexDirection: 'row',
  },
  calendarCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    marginVertical: 4,
  },
  dayCell: {
    borderRadius: 14,
  },
  dayCellSelected: {
    backgroundColor: '#10b981',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  dayLabelSelected: {
    color: '#ffffff',
  },
  dayLabelDisabled: {
    color: '#94a3b8',
  },
  calendarDoneButton: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  calendarDoneText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
