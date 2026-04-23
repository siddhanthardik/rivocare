import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingService, notificationService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import NotificationTray from '../../components/NotificationTray';

const SERVICES = [
  { id: 'nurse', title: 'Home Nurse', icon: 'heart-outline', color: '#ccfbf1', iconColor: '#0f766e', desc: 'Post-operative and elderly care' },
  { id: 'physiotherapist', title: 'Physiotherapist', icon: 'pulse-outline', color: '#e0e7ff', iconColor: '#4338ca', desc: 'Rehabilitation and pain relief' },
  { id: 'doctor', title: 'Doctor Consult', icon: 'medkit-outline', color: '#fef3c7', iconColor: '#b45309', desc: 'At-home general physician' },
  { id: 'caretaker', title: 'Trained Caretaker', icon: 'person-add-outline', color: '#fce7f3', iconColor: '#be185d', desc: 'Daily living assistance' },
];

export default function PatientHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchHomeData = async () => {
    try {
      const [bookingsResponse, notificationsResponse] = await Promise.all([
        bookingService.getMyBookings(),
        notificationService.getAll(3),
      ]);

      if (bookingsResponse.data?.success) {
        setBookings(bookingsResponse.data.data.bookings || []);
      }

      if (notificationsResponse.data?.success) {
        setNotifications(notificationsResponse.data.data.notifications || []);
        setUnreadCount(notificationsResponse.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.warn('Failed to load patient home:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchHomeData();
    }, [])
  );

  const quickStats = useMemo(() => {
    const completed = bookings.filter((booking) => booking.status === 'completed').length;
    const active = bookings.filter((booking) => ['pending', 'confirmed', 'in-progress'].includes(booking.status)).length;
    const paymentPending = bookings.filter(
      (booking) => booking.status === 'confirmed' && booking.paymentStatus !== 'PAID'
    ).length;

    return [
      { icon: 'bookmarks-outline', label: 'Active', value: String(active) },
      { icon: 'checkmark-done-circle-outline', label: 'Completed', value: String(completed) },
      { icon: 'card-outline', label: 'Pending Pay', value: String(paymentPending) },
    ];
  }, [bookings]);

  const filteredServices = useMemo(() => {
    return SERVICES.filter((service) =>
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

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
        navigation.navigate('BookingDetails', { booking: matchingBooking, context: 'patient' });
        return;
      }
    }

    navigation.navigate('History');
  };

  const renderStatCard = (item) => (
    <View key={item.label} style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={item.icon} size={22} color="#10b981" />
      </View>
      <Text style={styles.statValue}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 14, paddingBottom: 150 + insets.bottom }]}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>RIVO CARE</Text>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Patient'}</Text>
            <Text style={styles.headerSubtitle}>Find the best care for your loved ones</Text>
          </View>

          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.88}
          >
            <Ionicons name="notifications-outline" size={22} color="#0f172a" />
            {unreadCount > 0 ? (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Book trusted healthcare at home.</Text>
          <Text style={styles.heroSubtitle}>
            Search services, compare providers, and stay on top of booking and payment updates.
          </Text>
          <Button
            title="Book a Service"
            icon="arrow-forward"
            size="medium"
            onPress={() => navigation.navigate('Booking', { service: 'nurse' })}
            style={styles.heroButton}
          />
        </View>

        <View style={styles.statsRow}>
          {quickStats.map(renderStatCard)}
        </View>

        <NotificationTray
          title="Your updates"
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

        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#cbd5e1"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.85}>
              <Ionicons name="close-circle" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          {loading ? <ActivityIndicator size="small" color="#10b981" /> : null}
        </View>

        {filteredServices.map((item) => (
          <Card key={item.id} pressable onPress={() => navigation.navigate('Booking', { service: item.id })}>
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} color={item.iconColor} size={30} />
              </View>
              <View style={styles.cardDesc}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </View>
          </Card>
        ))}

        {!filteredServices.length ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={44} color="#cbd5e1" />
            <Text style={styles.emptyText}>No services found for your search.</Text>
          </View>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 14,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 6,
  },
  greeting: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
  },
  headerAction: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    backgroundColor: '#0f172a',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#cbd5e1',
    marginBottom: 16,
  },
  heroButton: {
    alignSelf: 'flex-start',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 58,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardDesc: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
});
