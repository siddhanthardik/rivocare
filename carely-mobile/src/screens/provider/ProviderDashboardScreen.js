import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingService, providerService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';

const formatWhen = (booking) => {
  const scheduledAt = booking?.scheduledAt ? new Date(booking.scheduledAt) : null;
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    return 'Schedule unavailable';
  }

  return `${scheduledAt.toLocaleDateString()} • ${scheduledAt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export default function ProviderDashboardScreen({ navigation }) {
  const { user, providerProfile, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [requests, setRequests] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  const initializeScreen = async () => {
    try {
      if (providerProfile) {
        setIsOnline(providerProfile.isOnline || false);
      }

      const response = await bookingService.getMyBookings();
      if (response.data?.success) {
        const bookings = response.data.data.bookings || [];
        setAllBookings(bookings);
        setRequests(bookings.filter((booking) => booking.status === 'pending').slice(0, 3));
      }
    } catch (error) {
      console.warn('Error loading dashboard:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeScreen();
  }, [providerProfile]);

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

  const toggleAvailability = async () => {
    setChangingStatus(true);
    try {
      const response = await providerService.toggleAvailability();
      if (response.data?.success) {
        setIsOnline(response.data.data.isOnline);
      }
    } catch (error) {
      console.warn('Failed to toggle status:', error.response?.data?.message || error.message);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await bookingService.updateStatus(bookingId, status);
      setRequests((current) => current.filter((booking) => booking._id !== bookingId));
      setAllBookings((current) =>
        current.map((booking) => (booking._id === bookingId ? { ...booking, status } : booking))
      );
    } catch (error) {
      console.warn('Error updating request:', error.response?.data?.message || error.message);
    }
  };

  const renderRequestCard = ({ item }) => (
    <Card variant="outlined" style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestIconBg}>
          <Ionicons name="person-outline" size={18} color="#10b981" />
        </View>
        <View style={styles.requestText}>
          <Text style={styles.requestTitle}>{item.patient?.name || 'Patient'}</Text>
          <Text style={styles.requestSubtitle}>{item.service?.toUpperCase() || 'SERVICE'}</Text>
        </View>
        <Text style={styles.requestPrice}>
          {typeof item.totalAmount === 'number' ? `Rs ${item.totalAmount}` : 'Pending'}
        </Text>
      </View>

      <View style={styles.requestDivider} />

      <View style={styles.requestDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color="#10b981" />
          <Text style={styles.detailText}>{formatWhen(item)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color="#10b981" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Reject"
          icon="close"
          variant="secondary"
          size="small"
          onPress={() => handleStatusUpdate(item._id, 'cancelled')}
          style={styles.flexButton}
        />
        <Button
          title="Accept"
          icon="checkmark"
          size="small"
          onPress={() => handleStatusUpdate(item._id, 'confirmed')}
          style={styles.flexButton}
        />
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0] || 'Provider'}</Text>
            <Text style={styles.headerSubtitle}>Manage your bookings</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <Card
          style={[
            styles.statusCard,
            isOnline ? styles.statusCardOnline : styles.statusCardOffline,
          ]}
        >
          <View style={styles.statusInfo}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? '#10b981' : '#94a3b8' },
              ]}
            />
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusTitle}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Text style={styles.statusSubtitle}>
                {isOnline ? 'Accepting bookings' : 'Not accepting bookings'}
              </Text>
            </View>
          </View>
          <Switch
            trackColor={{ false: '#cbd5e1', true: '#86efac' }}
            thumbColor={isOnline ? '#10b981' : '#f8fafc'}
            ios_backgroundColor="#cbd5e1"
            onValueChange={toggleAvailability}
            value={isOnline}
            disabled={changingStatus}
          />
        </Card>

        <View style={styles.metricsContainer}>
          <Card style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="cash-outline" size={22} color="#10b981" />
            </View>
            <Text style={styles.metricLabel}>Completed Earnings</Text>
            <Text style={styles.metricValue}>Rs {metrics.earnings}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="checkmark-done-circle-outline" size={22} color="#10b981" />
            </View>
            <Text style={styles.metricLabel}>Completed Jobs</Text>
            <Text style={styles.metricValue}>{metrics.completed}</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Incoming Requests</Text>
            {requests.length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{requests.length}</Text>
              </View>
            ) : null}
          </View>

          {requests.length === 0 ? (
            <View style={styles.emptyRequest}>
              <Ionicons name="inbox-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyRequestText}>No pending requests</Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item._id}
              renderItem={renderRequestCard}
              scrollEnabled={false}
            />
          )}

          {requests.length > 0 ? (
            <Button
              title="View All Requests"
              icon="arrow-forward"
              variant="secondary"
              size="small"
              onPress={() => navigation.navigate('Requests')}
              style={styles.viewAllButton}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Snapshot</Text>
          <View style={styles.snapshotGrid}>
            <Card style={styles.snapshotCard}>
              <Text style={styles.snapshotValue}>{metrics.active}</Text>
              <Text style={styles.snapshotLabel}>Active Jobs</Text>
            </Card>
            <Card style={styles.snapshotCard}>
              <Text style={styles.snapshotValue}>{allBookings.length}</Text>
              <Text style={styles.snapshotLabel}>Total Bookings</Text>
            </Card>
          </View>
        </View>

        <View style={styles.section}>
          <Button
            title="Visit Profile"
            icon="person-outline"
            variant="secondary"
            size="medium"
            onPress={() => navigation.navigate('Profile')}
            style={styles.actionButton}
          />
          <Button
            title="Open Requests"
            icon="list-outline"
            variant="secondary"
            size="medium"
            onPress={() => navigation.navigate('Requests')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  logoutBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  statusCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  statusCardOnline: {
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
  },
  statusCardOffline: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10b981',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#10b981',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },
  requestCard: {
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  requestIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
  },
  requestText: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
  },
  requestSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  requestPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
  },
  requestDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  requestDetails: {
    gap: 8,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  emptyRequest: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyRequestText: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  viewAllButton: {
    marginTop: 12,
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  snapshotCard: {
    flex: 1,
    alignItems: 'center',
  },
  snapshotValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 6,
  },
  snapshotLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 10,
  },
});
