import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
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
import { walletService } from '../../api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toLocaleString('en-IN')}`;
const formatDate = (value) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ProviderEarningsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  const fetchWallet = async () => {
    try {
      const [walletResponse, transactionResponse] = await Promise.all([
        walletService.getInfo(),
        walletService.getTransactions({ limit: 50 }),
      ]);

      setWallet(walletResponse.data?.data?.wallet || { balance: 0 });
      setTransactions(transactionResponse.data?.data?.transactions || []);
    } catch (error) {
      console.warn('Failed to load wallet:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchWallet();
    }, [])
  );

  const totalEarnings = useMemo(
    () => transactions.filter((item) => item.type === 'CREDIT').reduce((sum, item) => sum + item.amount, 0),
    [transactions]
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWallet();
  };

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) return;
    setRequesting(true);
    try {
      await walletService.requestPayout(amount);
      setPayoutAmount('');
      fetchWallet();
    } catch (error) {
      console.warn('Payout request failed:', error.response?.data?.message || error.message);
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.88}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
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
            <Text style={styles.eyebrow}>WALLET</Text>
            <Text style={styles.headerTitle}>Earnings & Payouts</Text>
            <Text style={styles.headerSubtitle}>Track your provider revenue and request manual payout from your wallet.</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Available Balance</Text>
            <Text style={styles.statValue}>{formatCurrency(wallet.balance)}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>All-Time Earnings</Text>
            <Text style={styles.statValue}>{formatCurrency(totalEarnings)}</Text>
          </Card>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Request Payout</Text>
          <Text style={styles.sectionBody}>Withdraw from your provider wallet to your registered bank account.</Text>
          <TextInput
            style={styles.input}
            value={payoutAmount}
            onChangeText={setPayoutAmount}
            placeholder="Enter amount"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
          />
          <Button
            title="Request Payout"
            icon="arrow-down-circle-outline"
            onPress={handleRequestPayout}
            loading={requesting}
            disabled={!payoutAmount}
          />
        </Card>

        <View style={styles.transactionsHeader}>
          <Text style={styles.sectionTitle}>Wallet Ledger</Text>
        </View>

        {transactions.map((transaction) => (
          <Card key={transaction._id} style={styles.transactionCard}>
            <View style={styles.transactionTopRow}>
              <View style={[styles.txBadge, transaction.type === 'CREDIT' ? styles.txCredit : styles.txDebit]}>
                <Ionicons
                  name={transaction.type === 'CREDIT' ? 'arrow-up-outline' : 'arrow-down-outline'}
                  size={15}
                  color={transaction.type === 'CREDIT' ? '#047857' : '#334155'}
                />
                <Text style={[styles.txBadgeText, transaction.type === 'CREDIT' ? styles.txCreditText : styles.txDebitText]}>
                  {transaction.type}
                </Text>
              </View>
              <Text style={styles.txAmount}>
                {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </Text>
            </View>
            <Text style={styles.txDescription}>{transaction.description}</Text>
            <Text style={styles.txDate}>{formatDate(transaction.createdAt)}</Text>
          </Card>
        ))}

        {!transactions.length ? (
          <EmptyState
            icon="wallet-outline"
            title="No transactions yet"
            description="Complete provider bookings to start building wallet history."
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
  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  statCard: { flex: 1, marginVertical: 0 },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#10b981' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  sectionBody: { fontSize: 13, lineHeight: 19, color: '#64748b', marginBottom: 14 },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe4ee',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 14,
  },
  transactionsHeader: { marginTop: 16, marginBottom: 10 },
  transactionCard: { marginVertical: 0, marginBottom: 12 },
  transactionTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  txBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  txCredit: { backgroundColor: '#ecfdf5' },
  txDebit: { backgroundColor: '#f1f5f9' },
  txBadgeText: { fontSize: 11, fontWeight: '800' },
  txCreditText: { color: '#047857' },
  txDebitText: { color: '#334155' },
  txAmount: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  txDescription: { fontSize: 13, lineHeight: 18, color: '#475569', fontWeight: '600', marginBottom: 6 },
  txDate: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
});
