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
import { subscriptionService } from '../../api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';

export default function PlansPackagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [plans, setPlans] = useState([]);
  const [packages, setPackages] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [myPackages, setMyPackages] = useState([]);
  const [actionId, setActionId] = useState('');

  const fetchData = async () => {
    try {
      const [plansRes, packagesRes, subscriptionsRes, myPackagesRes] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getPackages(),
        subscriptionService.getMySubscriptions(),
        subscriptionService.getMyPackages(),
      ]);

      setPlans(plansRes.data?.data?.plans || []);
      setPackages(packagesRes.data?.data?.packages || []);
      setMySubscriptions(subscriptionsRes.data?.data?.subscriptions || []);
      setMyPackages(myPackagesRes.data?.data?.packages || []);
    } catch (error) {
      console.warn('Failed to load plans and packages:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePurchasePlan = async (planId) => {
    setActionId(planId);
    try {
      await subscriptionService.purchasePlan(planId);
      setActiveTab('active');
      fetchData();
    } catch (error) {
      console.warn('Failed to purchase plan:', error.response?.data?.message || error.message);
    } finally {
      setActionId('');
    }
  };

  const handlePurchasePackage = async (packageId) => {
    setActionId(packageId);
    try {
      await subscriptionService.purchasePackage(packageId);
      setActiveTab('active');
      fetchData();
    } catch (error) {
      console.warn('Failed to purchase package:', error.response?.data?.message || error.message);
    } finally {
      setActionId('');
    }
  };

  const renderMarketplace = () => (
    <View style={styles.sectionStack}>
      <View>
        <Text style={styles.groupTitle}>Subscriptions</Text>
        <Text style={styles.groupSubtitle}>Structured recurring care for long-term support.</Text>
      </View>

      {plans.map((plan) => (
        <Card key={plan._id} style={styles.planCard}>
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.cardTitle}>{plan.name}</Text>
              <Text style={styles.cardMeta}>{plan.serviceType} care</Text>
            </View>
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>Rs {plan.price}</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="repeat-outline" size={16} color="#10b981" />
            <Text style={styles.featureText}>{plan.sessionsPerWeek} sessions per week for {plan.durationDays} days</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
            <Text style={styles.featureText}>{plan.description}</Text>
          </View>

          <Button
            title="Subscribe"
            onPress={() => handlePurchasePlan(plan._id)}
            loading={actionId === plan._id}
          />
        </Card>
      ))}

      {!plans.length ? (
        <EmptyState
          icon="albums-outline"
          title="No plans available"
          description="Active subscription plans will appear here when published."
        />
      ) : null}

      <View style={styles.sectionSpacer} />

      <View>
        <Text style={styles.groupTitle}>Packages</Text>
        <Text style={styles.groupSubtitle}>Bulk sessions for focused short-term care needs.</Text>
      </View>

      {packages.map((pkg) => (
        <Card key={pkg._id} style={styles.planCard}>
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.cardTitle}>{pkg.name}</Text>
              <Text style={styles.cardMeta}>{pkg.serviceType} package</Text>
            </View>
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>Rs {pkg.price}</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="calendar-outline" size={16} color="#10b981" />
            <Text style={styles.featureText}>{pkg.totalSessions} sessions valid for {pkg.validityDays} days</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
            <Text style={styles.featureText}>{pkg.description}</Text>
          </View>

          <Button
            title="Buy Package"
            onPress={() => handlePurchasePackage(pkg._id)}
            loading={actionId === pkg._id}
          />
        </Card>
      ))}

      {!packages.length ? (
        <EmptyState
          icon="cube-outline"
          title="No packages available"
          description="Active therapy and care packages will appear here when published."
        />
      ) : null}
    </View>
  );

  const renderActiveCare = () => (
    <View style={styles.sectionStack}>
      <Text style={styles.groupTitle}>My Active Care</Text>

      {mySubscriptions.map((subscription) => (
        <Card key={subscription._id} style={styles.activeCard}>
          <Text style={styles.cardTitle}>{subscription.plan?.name || 'Subscription'}</Text>
          <Text style={styles.cardMeta}>Status: {subscription.status}</Text>
          {subscription.provider?.user?.name ? (
            <Text style={styles.activeInfo}>Assigned provider: {subscription.provider.user.name}</Text>
          ) : null}
        </Card>
      ))}

      {myPackages.map((pkg) => (
        <Card key={pkg._id} style={styles.activeCard}>
          <Text style={styles.cardTitle}>{pkg.package?.name || 'Package'}</Text>
          <Text style={styles.cardMeta}>Status: {pkg.status}</Text>
          <Text style={styles.activeInfo}>Sessions remaining: {pkg.sessionsRemaining}</Text>
          {pkg.provider?.user?.name ? (
            <Text style={styles.activeInfo}>Assigned provider: {pkg.provider.user.name}</Text>
          ) : null}
        </Card>
      ))}

      {!mySubscriptions.length && !myPackages.length ? (
        <EmptyState
          icon="medkit-outline"
          title="No active care yet"
          description="Purchase a plan or package to start long-term care coordination."
          actionText="Browse Marketplace"
          onAction={() => setActiveTab('marketplace')}
        />
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.88}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plans & Packages</Text>
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.88}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>CARE PLANS</Text>
            <Text style={styles.headerTitle}>Plans & Packages</Text>
            <Text style={styles.headerSubtitle}>Bring the long-term care marketplace from web into mobile.</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          {[
            { key: 'marketplace', label: 'Marketplace' },
            { key: 'active', label: 'My Active Care' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.88}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'marketplace' ? renderMarketplace() : renderActiveCare()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fb' },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
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
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  tab: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#ffffff' },
  sectionStack: { gap: 14 },
  groupTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  groupSubtitle: { marginTop: 4, fontSize: 13, lineHeight: 18, color: '#64748b' },
  planCard: { marginVertical: 0 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  cardMeta: { marginTop: 4, fontSize: 13, color: '#64748b', fontWeight: '600', textTransform: 'capitalize' },
  pricePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: '#ecfdf5' },
  pricePillText: { fontSize: 13, fontWeight: '800', color: '#10b981' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  featureText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#475569', fontWeight: '600' },
  sectionSpacer: { height: 8 },
  activeCard: { marginVertical: 0 },
  activeInfo: { marginTop: 8, fontSize: 13, lineHeight: 18, color: '#475569', fontWeight: '600' },
});
