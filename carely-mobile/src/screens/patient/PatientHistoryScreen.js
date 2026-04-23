import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import EmptyState from '../../components/EmptyState';
import Card from '../../components/Card';
import NotificationTray from '../../components/NotificationTray';
import { formatScheduleWindow } from '../../utils/dateTime';

const STATUS_META = {
  pending: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', icon: 'time-outline', label: 'Pending' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', icon: 'checkmark-circle-outline', label: 'Confirmed' },
  'in-progress': { bg: '#ecfdf5', text: '#065f46', border: '#86efac', icon: 'play-circle-outline', label: 'In Progress' },
  completed: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', icon: 'checkmark-done-circle-outline', label: 'Completed' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', icon: 'close-circle-outline', label: 'Cancelled' },
};

const PAGE_SIZE = 5;

export default function PatientHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBookings = async () => {
    try {
      const [bookingResponse, notificationResponse] = await Promise.all([
        bookingService.getMyBookings(),
        notificationService.getAll(5),
      ]);

      if (bookingResponse.data?.success) {
        const nextBookings = bookingResponse.data.data.bookings || [];
        nextBookings.sort((left, right) => new Date(right.scheduledAt || 0) - new Date(left.scheduledAt || 0));
        setBookings(nextBookings);
      }

      if (notificationResponse.data?.success) {
        setNotifications(notificationResponse.data.data.notifications || []);
        setUnreadCount(notificationResponse.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.warn('Failed to fetch bookings:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBookings();
    }, [])
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (activeTab === 'upcoming') {
        return ['pending', 'confirmed', 'in-progress'].includes(booking.status);
      }
      if (activeTab === 'completed') {
        return booking.status === 'completed';
      }
      if (activeTab === 'cancelled') {
        return booking.status === 'cancelled';
      }
      return true;
    });
  }, [activeTab, bookings]);

  const pageCount = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, bookings.length]);

  const paymentPrompts = useMemo(() => {
    return bookings.filter(
      (booking) => booking.status === 'confirmed' && booking.paymentStatus !== 'PAID'
    );
  }, [bookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const openBookingDetails = (booking) => {
    navigation.navigate('BookingDetails', { booking, context: 'patient' });
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
        openBookingDetails(matchingBooking);
        return;
      }
    }

    if (paymentPrompts.length > 0) {
      openBookingDetails(paymentPrompts[0]);
    }
  };

  const renderBooking = ({ item }) => {
    const statusMeta = STATUS_META[item.status] || STATUS_META.pending;
    const showPaymentPrompt = item.status === 'confirmed' && item.paymentStatus !== 'PAID';

    return (
      <Card variant="outlined" pressable onPress={() => openBookingDetails(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Ionicons name="medkit-outline" size={20} color="#10b981" />
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.serviceName}>{item.service?.toUpperCase() || 'SERVICE'}</Text>
            <Text style={styles.providerInfo}>
              Provider: {item.provider?.user?.name || 'Pending assignment'}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusMeta.bg, borderColor: statusMeta.border },
            ]}
          >
            <Ionicons
              name={statusMeta.icon}
              size={13}
              color={statusMeta.text}
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: statusMeta.text }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#10b981" />
            <Text style={styles.detailText}>{formatScheduleWindow(item.scheduledAt, item.durationHours)}</Text>
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

        {showPaymentPrompt ? (
          <View style={styles.paymentBanner}>
            <View style={styles.paymentCopy}>
              <Text style={styles.paymentTitle}>Payment pending</Text>
              <Text style={styles.paymentSubtitle}>
                Your provider has accepted this booking. Review the booking and prepare payment.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => openBookingDetails(item)}
              activeOpacity={0.88}
            >
              <Text style={styles.paymentButtonText}>Open</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>My Bookings</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={paginatedBookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBooking}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 20, paddingBottom: 150 + insets.bottom }}
        ListHeaderComponent={(
          <>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>BOOKINGS</Text>
              <Text style={styles.title}>My Bookings</Text>
            </View>

            <NotificationTray
              title="Booking alerts"
              notifications={notifications}
              unreadCount={unreadCount}
              onPressNotification={handleNotificationPress}
              actionLabel={unreadCount > 0 ? 'Mark all read' : null}
              onPressAction={async () => {
                try {
                  await notificationService.markAllAsRead();
                  setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
                  setUnreadCount(0);
                } catch (error) {
                  console.warn('Failed to mark notifications as read:', error.response?.data?.message || error.message);
                }
              }}
            />

            {paymentPrompts.length > 0 ? (
              <View style={styles.promptCard}>
                <Ionicons name="card-outline" size={20} color="#b45309" />
                <Text style={styles.promptText}>
                  {paymentPrompts.length} confirmed booking{paymentPrompts.length > 1 ? 's' : ''} need payment.
                </Text>
              </View>
            ) : null}

            <View style={styles.tabContainer}>
              {[
                { key: 'all', label: 'All' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' },
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

            {filteredBookings.length > 0 ? (
              <View style={styles.paginationSummary}>
                <Text style={styles.paginationSummaryText}>
                  Page {currentPage} of {pageCount}
                </Text>
                <Text style={styles.paginationSummaryText}>
                  {filteredBookings.length} booking{filteredBookings.length > 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}
          </>
        )}
        ListEmptyComponent={(
          <EmptyState
            icon="inbox-outline"
            title="No Bookings"
            description={`You do not have any ${activeTab === 'all' ? '' : activeTab} bookings yet`}
            actionText="Book a Service"
            onAction={() => navigation.navigate('Booking')}
          />
        )}
        ListFooterComponent={filteredBookings.length > PAGE_SIZE ? (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              activeOpacity={0.88}
            >
              <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#94a3b8' : '#0f172a'} />
              <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paginationButton, currentPage === pageCount && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
              activeOpacity={0.88}
            >
              <Text style={[styles.paginationButtonText, currentPage === pageCount && styles.paginationButtonTextDisabled]}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color={currentPage === pageCount ? '#94a3b8' : '#0f172a'} />
            </TouchableOpacity>
          </View>
        ) : <View style={styles.footerGap} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 18,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#9a3412',
  },
  tabContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
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
  paginationSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paginationSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
  },
  serviceName: {
    fontWeight: '800',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  },
  providerInfo: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
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
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  cardDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  paymentBanner: {
    marginTop: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentCopy: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9a3412',
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#b45309',
  },
  paymentButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#0f172a',
  },
  paymentButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  paginationButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe4ee',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  paginationButtonDisabled: {
    backgroundColor: '#f8fafc',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  paginationButtonTextDisabled: {
    color: '#94a3b8',
  },
  footerGap: {
    height: 12,
  },
});
