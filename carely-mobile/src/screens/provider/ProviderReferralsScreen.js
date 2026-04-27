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
import { providerService } from '../../api';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';

export default function ProviderReferralsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const fetchReferralData = async () => {
    try {
      const response = await providerService.getMyReferral();
      setData(response.data?.data || null);
    } catch (error) {
      console.warn('Failed to load referrals:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchReferralData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReferralData();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.88}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referrals</Text>
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
            <Text style={styles.eyebrow}>PARTNER REWARDS</Text>
            <Text style={styles.headerTitle}>Referral Center</Text>
            <Text style={styles.headerSubtitle}>Track your provider invite performance and referral reward progress.</Text>
          </View>
        </View>

        {data ? (
          <>
            <Card style={styles.heroCard}>
              <Text style={styles.heroLabel}>Referral code</Text>
              <Text style={styles.heroCode}>{data.referralCode}</Text>
              <Text style={styles.heroLink}>{data.referralLink}</Text>
            </Card>

            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{data.stats?.total || 0}</Text>
                <Text style={styles.statLabel}>Total Leads</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{data.stats?.onboarded || 0}</Text>
                <Text style={styles.statLabel}>Onboarded</Text>
              </Card>
            </View>

            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{data.stats?.pending || 0}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{data.stats?.rewards || 0}</Text>
                <Text style={styles.statLabel}>Rewards</Text>
              </Card>
            </View>

            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Referral History</Text>
            </View>

            {(data.history || []).map((item, index) => (
              <Card key={`${item.name}-${index}`} style={styles.historyCard}>
                <Text style={styles.historyName}>{item.name}</Text>
                <Text style={styles.historyMeta}>
                  {new Date(item.date).toLocaleDateString('en-GB')} • {item.status}
                </Text>
                <Text style={styles.rewardStatus}>Reward: {item.rewardStatus}</Text>
              </Card>
            ))}

            {!data.history?.length ? (
              <EmptyState
                icon="people-outline"
                title="No referrals yet"
                description="Once providers join using your referral link, their progress will appear here."
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            icon="git-network-outline"
            title="Referral center unavailable"
            description="We could not load your referral data right now."
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
  heroCard: { marginVertical: 0, marginBottom: 16, backgroundColor: '#0f172a' },
  heroLabel: { fontSize: 12, fontWeight: '700', color: '#cbd5e1', marginBottom: 6 },
  heroCode: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  heroLink: { fontSize: 12, lineHeight: 18, color: '#a7f3d0', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  statCard: { flex: 1, marginVertical: 0, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', color: '#10b981', marginBottom: 6 },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  historyHeader: { marginTop: 8, marginBottom: 10 },
  historyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  historyCard: { marginVertical: 0, marginBottom: 12 },
  historyName: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  historyMeta: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 6 },
  rewardStatus: { fontSize: 12, color: '#10b981', fontWeight: '800' },
});
