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
import { kycService } from '../../api';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';

const STATUS_META = {
  VERIFIED: { bg: '#ecfdf5', text: '#047857', label: 'Verified' },
  PENDING: { bg: '#fff7ed', text: '#c2410c', label: 'Pending review' },
  REJECTED: { bg: '#fef2f2', text: '#b91c1c', label: 'Rejected' },
};

export default function ProviderKYCStatusScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kyc, setKyc] = useState(null);

  const fetchStatus = async () => {
    try {
      const response = await kycService.getStatus();
      setKyc(response.data?.data || null);
    } catch (error) {
      if (error.response?.status === 404) {
        setKyc(null);
      } else {
        console.warn('Failed to load KYC status:', error.response?.data?.message || error.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStatus();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const meta = STATUS_META[kyc?.status] || STATUS_META.PENDING;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.88}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC Status</Text>
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
            <Text style={styles.eyebrow}>VERIFICATION</Text>
            <Text style={styles.headerTitle}>KYC Status</Text>
            <Text style={styles.headerSubtitle}>Review your current document-verification status from mobile.</Text>
          </View>
        </View>

        {kyc ? (
          <>
            <Card style={styles.statusCard}>
              <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                <Text style={[styles.statusPillText, { color: meta.text }]}>{meta.label}</Text>
              </View>
              <Text style={styles.infoTitle}>Registration Number</Text>
              <Text style={styles.infoValue}>{kyc.registrationNumber || 'Not available'}</Text>
              <Text style={styles.infoTitle}>Council Type</Text>
              <Text style={styles.infoValue}>{kyc.councilType || 'Not available'}</Text>
              {kyc.rejectedReason ? (
                <>
                  <Text style={styles.infoTitle}>Rejection Reason</Text>
                  <Text style={styles.rejectText}>{kyc.rejectedReason}</Text>
                </>
              ) : null}
            </Card>

            <Card>
              <Text style={styles.infoTitle}>Submitted Documents</Text>
              <Text style={styles.infoValue}>Government ID, degree certificate, and cheque details are on file.</Text>
            </Card>
          </>
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="No KYC submission found"
            description="Provider KYC has not been submitted from this account yet."
          />
        )}
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
  statusCard: { marginVertical: 0, marginBottom: 14 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, marginBottom: 14 },
  statusPillText: { fontSize: 12, fontWeight: '800' },
  infoTitle: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 4, marginTop: 6 },
  infoValue: { fontSize: 15, lineHeight: 20, color: '#0f172a', fontWeight: '700' },
  rejectText: { fontSize: 14, lineHeight: 20, color: '#b91c1c', fontWeight: '700' },
});
