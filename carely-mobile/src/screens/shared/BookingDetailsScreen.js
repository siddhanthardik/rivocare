import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { bookingService, paymentService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatScheduleWindow } from '../../utils/dateTime';

const STATUS_META = {
  pending: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', label: 'Pending' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', label: 'Confirmed' },
  'in-progress': { bg: '#ecfdf5', text: '#065f46', border: '#86efac', label: 'In Progress' },
  completed: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', label: 'Completed' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', label: 'Cancelled' },
};

const PAYMENT_META = {
  PENDING: { label: 'Unpaid', color: '#b45309' },
  PAID: { label: 'Paid', color: '#10b981' },
};

export default function BookingDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [booking, setBooking] = useState(route.params?.booking || null);
  const [working, setWorking] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const isProviderView = route.params?.context === 'provider' || user?.role === 'provider';

  const statusMeta = useMemo(() => STATUS_META[booking?.status] || STATUS_META.pending, [booking?.status]);
  const paymentMeta = useMemo(
    () => PAYMENT_META[booking?.paymentStatus] || PAYMENT_META.PENDING,
    [booking?.paymentStatus]
  );

  if (!booking) {
    return (
      <View style={[styles.container, styles.centerState]}>
        <Text style={styles.emptyText}>Booking details are unavailable.</Text>
      </View>
    );
  }

  const updateStatus = async (status) => {
    setWorking(true);
    try {
      await bookingService.updateStatus(booking._id, status);
      setBooking((current) => ({ ...current, status }));
      Alert.alert('Updated', `Booking marked as ${(STATUS_META[status]?.label || status).toLowerCase()}.`);
    } catch (error) {
      Alert.alert('Update failed', error.response?.data?.message || 'Unable to update booking status.');
    } finally {
      setWorking(false);
    }
  };

  const preparePayment = async () => {
    setWorking(true);
    try {
      const response = await paymentService.createOrder(booking._id);
      const order = response.data?.data?.order;
      setPaymentInfo(order || null);
      Alert.alert(
        'Payment initiated',
        `Payment order ${order?.id || ''} has been created for Rs ${booking.totalAmount || 0}.`
      );
    } catch (error) {
      Alert.alert('Payment unavailable', error.response?.data?.message || 'Unable to prepare payment for this booking.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <View style={styles.container}>
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
            <Text style={styles.eyebrow}>BOOKING DETAILS</Text>
            <Text style={styles.title}>{booking.service?.toUpperCase() || 'SERVICE'}</Text>
            <Text style={styles.subtitle}>Review the schedule, payment state, and service information in one place.</Text>
          </View>
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Current status</Text>
              <Text style={styles.heroTitle}>{statusMeta.label}</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg, borderColor: statusMeta.border }]}>
              <Text style={[styles.statusBadgeText, { color: statusMeta.text }]}>{statusMeta.label}</Text>
            </View>
          </View>

          <View style={styles.heroMetaRow}>
            <Ionicons name="time-outline" size={16} color="#10b981" />
            <Text style={styles.heroMetaText}>{formatScheduleWindow(booking.scheduledAt, booking.durationHours)}</Text>
          </View>

          <View style={styles.heroMetaRow}>
            <Ionicons name="card-outline" size={16} color={paymentMeta.color} />
            <Text style={[styles.heroMetaText, { color: paymentMeta.color }]}>Payment: {paymentMeta.label}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Service summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{isProviderView ? 'Patient' : 'Provider'}</Text>
            <Text style={styles.detailValue}>
              {isProviderView ? booking.patient?.name || 'Patient' : booking.provider?.user?.name || 'Pending assignment'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{booking.address}, {booking.pincode}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{booking.durationHours || 1} hour(s)</Text>
          </View>
          <View style={styles.detailRowLast}>
            <Text style={styles.detailLabel}>Total amount</Text>
            <Text style={styles.detailValue}>Rs {booking.totalAmount || 0}</Text>
          </View>
        </Card>

        {booking.notes ? (
          <Card>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </Card>
        ) : null}

        {!isProviderView && booking.status === 'confirmed' && booking.paymentStatus !== 'PAID' ? (
          <Card style={styles.actionCard}>
            <Text style={styles.sectionTitle}>Payment action</Text>
            <Text style={styles.actionBody}>
              Your provider has confirmed the booking. Prepare the payment order from here so the booking can move forward cleanly.
            </Text>
            <Button title="Prepare Payment" icon="card-outline" onPress={preparePayment} loading={working} />
            {paymentInfo?.id ? (
              <View style={styles.paymentInfoBox}>
                <Text style={styles.paymentInfoLabel}>Order reference</Text>
                <Text style={styles.paymentInfoValue}>{paymentInfo.id}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {isProviderView ? (
          <Card style={styles.actionCard}>
            <Text style={styles.sectionTitle}>Provider actions</Text>
            <Text style={styles.actionBody}>
              Keep the booking flow accurate so the patient always sees the current stage.
            </Text>
            <View style={styles.actionGrid}>
              {booking.status === 'pending' ? (
                <View style={styles.actionRow}>
                  <Button
                    title="Decline"
                    variant="secondary"
                    icon="close"
                    size="small"
                    onPress={() => updateStatus('cancelled')}
                    loading={working}
                    style={styles.flexAction}
                  />
                  <Button
                    title="Accept"
                    icon="checkmark"
                    size="small"
                    onPress={() => updateStatus('confirmed')}
                    loading={working}
                    style={styles.flexAction}
                  />
                </View>
              ) : null}

              {booking.status === 'confirmed' ? (
                <Button
                  title="Start Service"
                  icon="play-circle-outline"
                  onPress={() => updateStatus('in-progress')}
                  loading={working}
                />
              ) : null}

              {booking.status === 'in-progress' ? (
                <Button
                  title="Mark Completed"
                  icon="checkmark-done-circle-outline"
                  onPress={() => updateStatus('completed')}
                  loading={working}
                />
              ) : null}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  centerState: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
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
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },
  heroCard: {
    marginBottom: 16,
    backgroundColor: '#0f172a',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  heroMetaText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  detailRow: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  detailRowLast: {
    paddingBottom: 0,
    marginBottom: 0,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: '#0f172a',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
  actionCard: {
    marginBottom: 12,
  },
  actionBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
    marginBottom: 16,
  },
  paymentInfoBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentInfoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4,
  },
  paymentInfoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  actionGrid: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexAction: {
    flex: 1,
  },
});
