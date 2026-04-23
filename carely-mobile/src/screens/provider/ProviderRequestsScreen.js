import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingService, notificationService } from '../../api';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import NotificationTray from '../../components/NotificationTray';
import { formatScheduleWindow } from '../../utils/dateTime';

const STATUS_META = {
  pending: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', icon: 'time-outline', label: 'Pending' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', icon: 'checkmark-circle-outline', label: 'Confirmed' },
  'in-progress': { bg: '#ecfdf5', text: '#065f46', border: '#86efac', icon: 'play-circle-outline', label: 'In Progress' },
  completed: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', icon: 'checkmark-done-circle-outline', label: 'Completed' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', icon: 'close-circle-outline', label: 'Cancelled' },
};

export default function ProviderRequestsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [updatingId, setUpdatingId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchRequests = async () => {
    try {
      const [bookingResponse, notificationResponse] = await Promise.all([
        bookingService.getMyBookings(),
        notificationService.getAll(4),
      ]);

      if (bookingResponse.data?.success) {
        setBookings(bookingResponse.data.data.bookings || []);
      }

      if (notificationResponse.data?.success) {
        setNotifications(notificationResponse.data.data.notifications || []);
        setUnreadCount(notificationResponse.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.warn('Failed to fetch provider requests:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRequests();
    }, [])
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (activeTab === 'pending') {
        return booking.status === 'pending';
      }
      if (activeTab === 'active') {
        return ['confirmed', 'in-progress'].includes(booking.status);
      }
      if (activeTab === 'completed') {
        return booking.status === 'completed';
      }
      return true;
    });
  }, [activeTab, bookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
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
      const matchingBooking = bookings.find((item) => item._id === notification.linkId);
      if (matchingBooking) {
        navigation.navigate('BookingDetails', { booking: matchingBooking, context: 'provider' });
        return;
      }
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await bookingService.updateStatus(id, status);
      setBookings((current) =>
        current.map((booking) => (booking._id === id ? { ...booking, status } : booking))
      );
    } catch (error) {
      console.warn('Failed to update status:', error.response?.data?.message || error.message);
    } finally {
      setUpdatingId('');
    }
  };

  const renderActionArea = (item) => {
    if (item.status === 'pending') {
      return (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryAction, updatingId === item._id && styles.buttonDisabled]}
            onPress={() => updateStatus(item._id, 'cancelled')}
            disabled={updatingId === item._id}
            activeOpacity={0.88}
          >
            <Ionicons name="close" size={18} color="#ef4444" />
            <Text style={styles.secondaryActionText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryAction, updatingId === item._id && styles.buttonDisabled]}
            onPress={() => updateStatus(item._id, 'confirmed')}
            disabled={updatingId === item._id}
            activeOpacity={0.88}
          >
            <Ionicons name="checkmark" size={18} color="#ffffff" />
            <Text style={styles.primaryActionText}>Accept</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (item.status === 'confirmed') {
      return (
        <TouchableOpacity
          style={[styles.infoAction, updatingId === item._id && styles.buttonDisabled]}
          onPress={() => updateStatus(item._id, 'in-progress')}
          disabled={updatingId === item._id}
          activeOpacity={0.88}
        >
          <Ionicons name="play-circle" size={18} color="#ffffff" />
          <Text style={styles.primaryActionText}>Start Service</Text>
        </TouchableOpacity>
      );
    }

    if (item.status === 'in-progress') {
      return (
        <TouchableOpacity
          style={[styles.primaryAction, updatingId === item._id && styles.buttonDisabled]}
          onPress={() => updateStatus(item._id, 'completed')}
          disabled={updatingId === item._id}
          activeOpacity={0.88}
        >
          <Ionicons name="checkmark-done-circle" size={18} color="#ffffff" />
          <Text style={styles.primaryActionText}>Mark Completed</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderRequestCard = ({ item }) => {
    const statusMeta = STATUS_META[item.status] || STATUS_META.pending;

    return (
      <Card
        variant="outlined"
        style={styles.card}
        pressable
        onPress={() => navigation.navigate('BookingDetails', { booking: item, context: 'provider' })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.patientIcon}>
            <Ionicons name="person-outline" size={18} color="#10b981" />
          </View>

          <View style={styles.cardCopy}>
            <Text style={styles.patientName}>{item.patient?.name || 'Patient'}</Text>
            <Text style={styles.serviceName}>{item.service?.toUpperCase() || 'SERVICE'}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg, borderColor: statusMeta.border }]}>
            <Ionicons name={statusMeta.icon} size={13} color={statusMeta.text} style={styles.statusIcon} />
            <Text style={[styles.statusText, { color: statusMeta.text }]}>{statusMeta.label}</Text>
          </View>
        </View>

        <View style={styles.detailsBlock}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#10b981" />
            <Text style={styles.detailText}>
              {formatScheduleWindow(item.scheduledAt, item.durationHours)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#10b981" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.address}, {item.pincode}
            </Text>
          </View>

          {typeof item.totalAmount === 'number' ? (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={16} color="#10b981" />
              <Text style={styles.detailText}>Rs {item.totalAmount}</Text>
            </View>
          ) : null}
        </View>

        {renderActionArea(item)}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>REQUESTS</Text>
          <Text style={styles.title}>Service Requests</Text>
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item._id}
        renderItem={renderRequestCard}
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
        ListHeaderComponent={(
          <>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>REQUESTS</Text>
              <Text style={styles.title}>Service Requests</Text>
              <Text style={styles.subtitle}>Accept, start, and complete bookings without fighting the interface.</Text>
            </View>

            <NotificationTray
              title="Latest alerts"
              notifications={notifications}
              unreadCount={unreadCount}
              onPressNotification={handleNotificationPress}
            />

            <View style={styles.tabRow}>
              {[
                { key: 'pending', label: 'Pending' },
                { key: 'active', label: 'Active' },
                { key: 'completed', label: 'Completed' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        ListEmptyComponent={(
          <EmptyState
            icon="inbox-outline"
            title={`No ${activeTab} requests`}
            description="As new bookings move through the workflow, they will show up here."
            actionText="Refresh"
            onAction={onRefresh}
          />
        )}
      />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  card: {
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  patientIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailsBlock: {
    gap: 10,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryAction: {
    minHeight: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#10b981',
  },
  infoAction: {
    minHeight: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#2563eb',
  },
  secondaryAction: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryActionText: {
    color: '#e11d48',
    fontWeight: '800',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
