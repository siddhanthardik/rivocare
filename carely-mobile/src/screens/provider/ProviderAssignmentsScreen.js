import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { providerService, subscriptionService } from '../../api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';

export default function ProviderAssignmentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [busyId, setBusyId] = useState('');

  const fetchAssignments = async () => {
    try {
      const response = await providerService.getAssignments();
      setAssignments(response.data?.data?.assignments || []);
    } catch (error) {
      console.warn('Failed to load assignments:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAssignments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const handleStatusUpdate = async (id, status) => {
    setBusyId(id);
    try {
      await providerService.updateAssignment(id, status);
      fetchAssignments();
    } catch (error) {
      console.warn('Failed to update assignment:', error.response?.data?.message || error.message);
      setBusyId('');
    }
  };

  const handleLogSession = async (packageId) => {
    setBusyId(packageId);
    try {
      await subscriptionService.logSession(packageId);
      fetchAssignments();
    } catch (error) {
      console.warn('Failed to log session:', error.response?.data?.message || error.message);
      setBusyId('');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.88}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assignments</Text>
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
          paddingBottom: insets.bottom + 32,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={['#10b981']} />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.88}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>LONG-TERM CARE</Text>
            <Text style={styles.headerTitle}>Assignments</Text>
            <Text style={styles.headerSubtitle}>Accept or reject assigned subscriptions and log package sessions.</Text>
          </View>
        </View>

        {assignments.map((assignment) => (
          <Card key={assignment._id} style={styles.assignmentCard}>
            <View style={styles.cardBadgeRow}>
              <View style={[styles.badge, assignment.status === 'PENDING' ? styles.badgeWarning : assignment.status === 'ACCEPTED' ? styles.badgeSuccess : styles.badgeMuted]}>
                <Text style={[styles.badgeText, assignment.status === 'PENDING' ? styles.badgeWarningText : assignment.status === 'ACCEPTED' ? styles.badgeSuccessText : styles.badgeMutedText]}>
                  {assignment.status}
                </Text>
              </View>
              <Text style={styles.assignmentType}>{assignment.type}</Text>
            </View>

            <Text style={styles.patientName}>{assignment.patient?.name || 'Patient'}</Text>
            <Text style={styles.patientMeta}>{assignment.patient?.phone || 'No phone'} • {assignment.patient?.address || 'No address'}</Text>

            {assignment.notes ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>Admin note</Text>
                <Text style={styles.noteText}>{assignment.notes}</Text>
              </View>
            ) : null}

            {assignment.status === 'ACCEPTED' && assignment.type === 'PACKAGE' && assignment.referenceId?.sessionsRemaining !== undefined ? (
              <View style={styles.sessionsBox}>
                <Text style={styles.sessionsValue}>{assignment.referenceId.sessionsRemaining}</Text>
                <Text style={styles.sessionsLabel}>sessions left</Text>
                {assignment.referenceId.sessionsRemaining > 0 ? (
                  <Button
                    title="Log Visit"
                    icon="add-outline"
                    variant="secondary"
                    size="small"
                    onPress={() => handleLogSession(assignment.referenceId._id)}
                    loading={busyId === assignment.referenceId._id}
                    style={styles.logButton}
                  />
                ) : null}
              </View>
            ) : null}

            {assignment.status === 'PENDING' ? (
              <View style={styles.actionsRow}>
                <Button
                  title="Reject"
                  icon="close"
                  variant="secondary"
                  size="small"
                  onPress={() => handleStatusUpdate(assignment._id, 'REJECTED')}
                  loading={busyId === assignment._id}
                  style={styles.flexAction}
                />
                <Button
                  title="Accept"
                  icon="checkmark"
                  size="small"
                  onPress={() => handleStatusUpdate(assignment._id, 'ACCEPTED')}
                  loading={busyId === assignment._id}
                  style={styles.flexAction}
                />
              </View>
            ) : null}
          </Card>
        ))}

        {!assignments.length ? (
          <EmptyState
            icon="briefcase-outline"
            title="No assignments yet"
            description="Assigned long-term care packages and subscriptions will appear here."
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fb' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1.2, fontWeight: '700', color: '#10b981', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  headerSubtitle: { marginTop: 8, fontSize: 14, lineHeight: 20, color: '#64748b' },
  assignmentCard: { marginVertical: 0, marginBottom: 14 },
  cardBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeWarning: { backgroundColor: '#fff7ed' },
  badgeSuccess: { backgroundColor: '#ecfdf5' },
  badgeMuted: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeWarningText: { color: '#c2410c' },
  badgeSuccessText: { color: '#047857' },
  badgeMutedText: { color: '#475569' },
  assignmentType: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  patientName: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  patientMeta: { fontSize: 13, lineHeight: 18, color: '#64748b', fontWeight: '600' },
  noteBox: { marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  noteTitle: { fontSize: 12, fontWeight: '800', color: '#b45309', marginBottom: 4 },
  noteText: { fontSize: 13, lineHeight: 19, color: '#92400e' },
  sessionsBox: { marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  sessionsValue: { fontSize: 26, fontWeight: '800', color: '#2563eb' },
  sessionsLabel: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginTop: 2 },
  logButton: { marginTop: 12, alignSelf: 'flex-start' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  flexAction: { flex: 1 },
});
