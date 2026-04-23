import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../../api';

const STATUS_META = {
  pending: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', icon: 'time-outline', label: 'Pending' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', icon: 'checkmark-circle-outline', label: 'Confirmed' },
  'in-progress': { bg: '#ecfdf5', text: '#065f46', border: '#86efac', icon: 'play-circle-outline', label: 'In Progress' },
  completed: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', icon: 'checkmark-done-circle-outline', label: 'Completed' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', icon: 'close-circle-outline', label: 'Cancelled' },
};

const formatSchedule = (booking) => {
  const start = booking?.scheduledAt ? new Date(booking.scheduledAt) : null;
  if (!start || Number.isNaN(start.getTime())) {
    return 'Schedule unavailable';
  }

  const hours = Number(booking.durationHours) || 1;
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

  return `${start.toLocaleDateString()} • ${start.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export default function ProviderRequestsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [updatingId, setUpdatingId] = useState('');

  const fetchBookings = async () => {
    try {
      const response = await bookingService.getMyBookings();
      if (response.data?.success) {
        setBookings(response.data.data.bookings || []);
      }
    } catch (error) {
      console.warn('Failed to fetch provider requests:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={[styles.secondaryAction, updatingId === item._id && styles.buttonDisabled]}
            onPress={() => updateStatus(item._id, 'cancelled')}
            disabled={updatingId === item._id}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={18} color="#ef4444" />
            <Text style={styles.secondaryActionText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryAction, updatingId === item._id && styles.buttonDisabled]}
            onPress={() => updateStatus(item._id, 'confirmed')}
            disabled={updatingId === item._id}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
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
          activeOpacity={0.85}
        >
          <Ionicons name="play-circle" size={18} color="#fff" />
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
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
          <Text style={styles.primaryActionText}>Mark Completed</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderRequestCard = ({ item }) => {
    const statusMeta = STATUS_META[item.status] || STATUS_META.pending;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardText}>
            <Text style={styles.patientName}>{item.patient?.name || 'Patient'}</Text>
            <Text style={styles.serviceName}>{item.service?.toUpperCase() || 'SERVICE'}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusMeta.bg, borderColor: statusMeta.border },
            ]}
          >
            <Ionicons
              name={statusMeta.icon}
              size={14}
              color={statusMeta.text}
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: statusMeta.text }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#10b981" />
            <Text style={styles.detailText}>{formatSchedule(item)}</Text>
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Service Requests</Text>
      </View>

      <View style={styles.tabContainer}>
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="inbox-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No {activeTab} requests</Text>
          <Text style={styles.emptySubtitle}>Requests will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item._id}
          renderItem={renderRequestCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchBookings();
              }}
              tintColor="#10b981"
              colors={['#10b981']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  cardText: {
    flex: 1,
  },
  patientName: {
    fontWeight: '800',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardDetails: {
    gap: 12,
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
    color: '#475569',
    fontWeight: '500',
  },
  actionsBox: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    minHeight: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#10b981',
  },
  infoAction: {
    minHeight: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#3b82f6',
  },
  secondaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryActionText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
