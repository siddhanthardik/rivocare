import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingService, notificationService, providerService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import NotificationTray from '../../components/NotificationTray';
import { formatScheduleWindow } from '../../utils/dateTime';

export default function ProviderDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, providerProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [requests, setRequests] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchDashboard = async () => {
    try {
      if (providerProfile) {
        setIsOnline(Boolean(providerProfile.isOnline));
      }

      const [bookingResponse, notificationResponse] = await Promise.all([
        bookingService.getMyBookings(),
        notificationService.getAll(4),
      ]);

      if (bookingResponse.data?.success) {
        const bookings = bookingResponse.data.data.bookings || [];
        setAllBookings(bookings);
        setRequests(bookings.filter((booking) => booking.status === 'pending').slice(0, 3));
      }

      if (notificationResponse.data?.success) {
        setNotifications(notificationResponse.data.data.notifications || []);
        setUnreadCount(notificationResponse.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.warn('Error loading provider dashboard:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDashboard();
    }, [providerProfile])
  );

  const metrics = useMemo(() => {
    return allBookings.reduce(
      (summary, booking) => {
        if (booking.status === 'completed') {
          summary.completed += 1;
        }
        if (booking.status === 'confirmed' || booking.status === 'in-progress') {
          summary.active += 1;
        }
        if (typeof booking.totalAmount === 'number' && booking.status === 'completed') {
          summary.earnings += booking.totalAmount;
        }
        return summary;
      },
      { completed: 0, active: 0, earnings: 0 }
    );
  }, [allBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const toggleAvailability = async () => {
    setChangingStatus(true);
    try {
      const response = await providerService.toggleAvailability();
      if (response.data?.success) {
        setIsOnline(response.data.data.isOnline);
      }
    } catch (error) {
      console.warn('Failed to update availability:', error.response?.data?.message || error.message);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleNotificationPress = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification._id);
        setNotifications((current) =>
          current.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((count) => Math.max(count - 1, 0));
      }
    } catch (error) {
      console.warn('Failed to mark notification as read:', error.response?.data?.message || error.message);
    }

    if (notification.linkId) {
      const matchingBooking = allBookings.find((item) => item._id === notification.linkId);
      if (matchingBooking) {
        navigation.navigate('BookingDetails', { booking: matchingBooking, context: 'provider' });
        return;
      }
    }

    navigation.navigate('Requests');
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await bookingService.updateStatus(bookingId, status);
      setRequests((current) => current.filter((booking) => booking._id !== bookingId));
      setAllBookings((current) =>
        current.map((booking) => (booking._id === bookingId ? { ...booking, status } : booking))
      );
    } catch (error) {
      console.warn('Failed to update request:', error.response?.data?.message || error.message);
    }
  };

  const renderRequestCard = ({ item }) => (
    <Card
      variant="outlined"
      style={styles.requestCard}
      pressable
      onPress={() => navigation.navigate('BookingDetails', { booking: item, context: 'provider' })}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestIcon}>
          <Ionicons name="person-outline" size={18} color="#10b981" />
        </View>

        <View style={styles.requestCopy}>
          <Text style={styles.requestPatient}>{item.patient?.name || 'Patient'}</Text>
          <Text style={styles.requestService}>{item.service?.toUpperCase() || 'SERVICE'}</Text>
        </View>

        <Text style={styles.requestAmount}>
          {typeof item.totalAmount === 'number' ? `Rs ${item.totalAmount}` : 'Pending'}
        </Text>
      </View>

      <View style={styles.requestDivider} />

      <View style={styles.requestMeta}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={15} color="#10b981" />
          <Text style={styles.metaText}>
            {formatScheduleWindow(item.scheduledAt, item.durationHours)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color="#10b981" />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.address}, {item.pincode}
          </Text>
        </View>
      </View>

      <View style={styles.requestActions}>
        <Button
          title="Decline"
          icon="close"
          variant="secondary"
          size="small"
          onPress={() => handleStatusUpdate(item._id, 'cancelled')}
          style={styles.flexAction}
        />
        <Button
          title="Accept"
          icon="checkmark"
          size="small"
          onPress={() => handleStatusUpdate(item._id, 'confirmed')}
          style={styles.flexAction}
        />
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PROVIDER</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 140,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PROVIDER</Text>
          <Text style={styles.title}>Hello, {user?.name?.split(' ')[0] || 'Provider'}</Text>
          <Text style={styles.subtitle}>A clean snapshot of your bookings, earnings, and requests.</Text>
        </View>

        <NotificationTray
          title="Updates for you"
          notifications={notifications}
          unreadCount={unreadCount}
          onPressNotification={handleNotificationPress}
        />

        <Card
          style={[
            styles.statusCard,
            isOnline ? styles.statusCardOnline : styles.statusCardOffline,
          ]}
        >
          <View style={styles.statusLeft}>
            <View style={[styles.statusGlow, isOnline ? styles.statusGlowOnline : styles.statusGlowOffline]} />
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>{isOnline ? 'Online and visible' : 'Offline right now'}</Text>
              <Text style={styles.statusSubtitle}>
                {isOnline ? 'Patients can send new requests to you.' : 'Pause visibility until you are ready.'}
              </Text>
            </View>
          </View>

          <Switch
            value={isOnline}
            onValueChange={toggleAvailability}
            disabled={changingStatus}
            trackColor={{ false: '#cbd5e1', true: '#86efac' }}
            thumbColor={isOnline ? '#10b981' : '#f8fafc'}
            ios_backgroundColor="#cbd5e1"
          />
        </Card>

        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="cash-outline" size={20} color="#10b981" />
            </View>
            <Text style={styles.metricLabel}>Completed Earnings</Text>
            <Text style={styles.metricValue}>Rs {metrics.earnings}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="checkmark-done-circle-outline" size={20} color="#10b981" />
            </View>
            <Text style={styles.metricLabel}>Completed Jobs</Text>
            <Text style={styles.metricValue}>{metrics.completed}</Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Incoming Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Requests')} activeOpacity={0.86}>
            <Text style={styles.sectionLink}>Open all</Text>
          </TouchableOpacity>
        </View>

        {requests.length === 0 ? (
          <EmptyState
            icon="sparkles-outline"
            title="No pending requests"
            description="New booking requests will appear here as soon as patients reach out."
            actionText="Refresh"
            onAction={onRefresh}
          />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item._id}
            renderItem={renderRequestCard}
            scrollEnabled={false}
          />
        )}

        <View style={styles.snapshotRow}>
          <Card style={styles.snapshotCard}>
            <Text style={styles.snapshotValue}>{metrics.active}</Text>
            <Text style={styles.snapshotLabel}>Active Jobs</Text>
          </Card>
          <Card style={styles.snapshotCard}>
            <Text style={styles.snapshotValue}>{allBookings.length}</Text>
            <Text style={styles.snapshotLabel}>Total Bookings</Text>
          </Card>
        </View>

        <Card style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Keep the workflow moving</Text>
          <Text style={styles.ctaText}>
            Review open requests quickly, then keep your profile polished so patients trust the experience.
          </Text>

          <View style={styles.ctaActions}>
            <Button
              title="Assignments"
              icon="briefcase-outline"
              variant="secondary"
              size="small"
              onPress={() => navigation.navigate('Assignments')}
              style={styles.flexAction}
            />
            <Button
              title="Earnings"
              icon="wallet-outline"
              size="small"
              onPress={() => navigation.navigate('Earnings')}
              style={styles.flexAction}
            />
          </View>

          <View style={styles.ctaActions}>
            <Button
              title="Referrals"
              icon="git-network-outline"
              variant="secondary"
              size="small"
              onPress={() => navigation.navigate('Referrals')}
              style={styles.flexAction}
            />
            <Button
              title="KYC Status"
              icon="shield-checkmark-outline"
              size="small"
              onPress={() => navigation.navigate('KYCStatus')}
              style={styles.flexAction}
            />
          </View>
        </Card>
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
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    maxWidth: 320,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 18,
  },
  statusCardOnline: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusCardOffline: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4f0',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  statusGlow: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  statusGlowOnline: {
    backgroundColor: '#10b981',
  },
  statusGlowOffline: {
    backgroundColor: '#94a3b8',
  },
  statusCopy: {
    marginLeft: 14,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 22,
  },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10b981',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  requestCard: {
    marginBottom: 14,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  requestIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestCopy: {
    flex: 1,
  },
  requestPatient: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  requestService: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  requestAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
  },
  requestDivider: {
    height: 1,
    backgroundColor: '#eef2f7',
    marginVertical: 12,
  },
  requestMeta: {
    gap: 10,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  flexAction: {
    flex: 1,
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
    marginBottom: 18,
  },
  snapshotCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  snapshotValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 6,
  },
  snapshotLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    textAlign: 'center',
  },
  ctaCard: {
    marginTop: 4,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
    marginBottom: 16,
  },
  ctaActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
