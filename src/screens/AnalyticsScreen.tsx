import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { DollarSign, Calendar, TrendingUp, BarChart3 } from 'lucide-react-native';
import { getMonthlyEarnings, getMonthlyEarningsDetail } from '../../utils/mongoStorage';

interface MonthlyEarning {
  year: number;
  month: string;
  totalEarnings: number;
  sessionCount: number;
}

interface EarningsDetail {
  year: number;
  month: string;
  totalEarnings: number;
  sessionCount: number;
  sessions: Array<{
    id: string;
    patientName: string;
    date: string;
    time: string;
    amount: number;
    completed: boolean;
  }>;
}

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyEarning | null>(null);
  const [earningsDetail, setEarningsDetail] = useState<EarningsDetail | null>(null);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F7FA',
    cardBackground: isDarkMode ? '#2A2A2A' : 'white',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    secondaryTextColor: isDarkMode ? '#B0B0B0' : '#6B7280',
    borderColor: isDarkMode ? '#444444' : '#E5E7EB',
    primaryColor: isDarkMode ? '#0A84FF' : '#00143f',
    greenColor: isDarkMode ? '#30D158' : '#10B981',
    greenLight: isDarkMode ? '#1C3A28' : '#D1FAE5',
    blueColor: isDarkMode ? '#0A84FF' : '#3B82F6',
    blueLight: isDarkMode ? '#1A2F3A' : '#DBEAFE',
    purpleColor: isDarkMode ? '#BF5AF2' : '#8B5CF6',
    purpleLight: isDarkMode ? '#2F1A3A' : '#EDE9FE',
    orangeColor: isDarkMode ? '#FF9F0A' : '#F59E0B',
    orangeLight: isDarkMode ? '#3A2F1A' : '#FEF3C7',
    selectedBorder: isDarkMode ? '#0A84FF' : '#8B5CF6',
    selectedBg: isDarkMode ? '#1A2F3A' : '#F3E8FF',
  };

  useEffect(() => {
    loadMonthlyEarnings();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMonthlyEarnings();
    setRefreshing(false);
  }, []);

  const loadMonthlyEarnings = async () => {
    setIsLoadingEarnings(true);
    try {
      const earnings = await getMonthlyEarnings();
      console.log('Monthly earnings loaded:', earnings);
      setMonthlyEarnings(earnings || []);
    } catch (error) {
      console.error('Error loading monthly earnings:', error);
      setMonthlyEarnings([]);
    } finally {
      setIsLoadingEarnings(false);
    }
  };

  const loadEarningsDetail = async (monthEarning: MonthlyEarning) => {
    setIsLoadingDetail(true);
    setSelectedMonth(monthEarning);
    try {
      const detail = await getMonthlyEarningsDetail(monthEarning.year, monthEarning.month);
      console.log('Earnings detail loaded:', detail);
      setEarningsDetail(detail);
    } catch (error) {
      console.error('Error loading earnings detail:', error);
      setEarningsDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatMonthYear = (month: string, year: number): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  };

  const formatEarnings = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    const [hour, minute] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Calculate analytics from current data
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthEarnings = monthlyEarnings.find(
    earning => earning.month === currentMonth.toString().padStart(2, '0') && earning.year === currentYear
  );

  const totalEarnings = monthlyEarnings.reduce((sum, earning) => sum + earning.totalEarnings, 0);
  const totalSessions = monthlyEarnings.reduce((sum, earning) => sum + earning.sessionCount, 0);
  const averageSessionValue = totalSessions > 0 ? totalEarnings / totalSessions : 0;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primaryColor}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>Analytics</Text>
        <Text style={[styles.headerSubtitle, { color: theme.secondaryTextColor }]}>
          Track your performance and earnings
        </Text>
      </View>

      {/* Overview Cards */}
      <View style={styles.overviewGrid}>
        <View style={[styles.overviewCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.greenLight }]}>
            <DollarSign size={24} color={theme.greenColor} />
          </View>
          <Text style={[styles.overviewLabel, { color: theme.secondaryTextColor }]}>Total Earnings</Text>
          <Text style={[styles.overviewValue, { color: theme.textColor }]}>{formatEarnings(totalEarnings)}</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.blueLight }]}>
            <Calendar size={24} color={theme.blueColor} />
          </View>
          <Text style={[styles.overviewLabel, { color: theme.secondaryTextColor }]}>Total Sessions</Text>
          <Text style={[styles.overviewValue, { color: theme.textColor }]}>{totalSessions}</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.purpleLight }]}>
            <BarChart3 size={24} color={theme.purpleColor} />
          </View>
          <Text style={[styles.overviewLabel, { color: theme.secondaryTextColor }]}>Avg Session Value</Text>
          <Text style={[styles.overviewValue, { color: theme.textColor }]}>{formatEarnings(Math.round(averageSessionValue))}</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.orangeLight }]}>
            <TrendingUp size={24} color={theme.orangeColor} />
          </View>
          <Text style={[styles.overviewLabel, { color: theme.secondaryTextColor }]}>This Month</Text>
          <Text style={[styles.overviewValue, { color: theme.textColor }]}>
            {currentMonthEarnings ? formatEarnings(currentMonthEarnings.totalEarnings) : '₹0'}
          </Text>
        </View>
      </View>

      {/* Monthly Earnings */}
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: theme.borderColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Monthly Earnings</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryTextColor }]}>
            Tap on a month to view details
          </Text>
        </View>

        {isLoadingEarnings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primaryColor} />
          </View>
        ) : monthlyEarnings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.borderColor }]}>
              <BarChart3 size={32} color={theme.secondaryTextColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textColor }]}>No earnings data</Text>
            <Text style={[styles.emptySubtitle, { color: theme.secondaryTextColor }]}>
              Complete some sessions to see your earnings
            </Text>
          </View>
        ) : (
          <View style={styles.monthlyList}>
            {monthlyEarnings.map((earning, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => loadEarningsDetail(earning)}
                style={[
                  styles.monthlyItem,
                  { 
                    backgroundColor: theme.cardBackground,
                    borderColor: selectedMonth?.year === earning.year && selectedMonth?.month === earning.month
                      ? theme.selectedBorder
                      : theme.borderColor
                  },
                  selectedMonth?.year === earning.year && selectedMonth?.month === earning.month && {
                    backgroundColor: theme.selectedBg,
                  }
                ]}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={[styles.monthlyTitle, { color: theme.textColor }]}>
                    {formatMonthYear(earning.month, earning.year)}
                  </Text>
                  <Text style={[styles.monthlySubtitle, { color: theme.secondaryTextColor }]}>
                    {earning.sessionCount} sessions
                  </Text>
                </View>
                <Text style={[styles.monthlyAmount, { color: theme.greenColor }]}>
                  {formatEarnings(earning.totalEarnings)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Session Details */}
      {selectedMonth && (
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.borderColor }]}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Session Details</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.secondaryTextColor }]}>
              {formatMonthYear(selectedMonth.month, selectedMonth.year)} - {selectedMonth.sessionCount} sessions
            </Text>
          </View>

          {isLoadingDetail ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primaryColor} />
            </View>
          ) : earningsDetail ? (
            <View style={styles.detailContent}>
              {/* Total Earnings Summary */}
              <View style={[styles.totalEarningsCard, { backgroundColor: theme.greenLight }]}>
                <Text style={[styles.totalEarningsLabel, { color: theme.greenColor }]}>Total Earnings</Text>
                <Text style={[styles.totalEarningsValue, { color: theme.greenColor }]}>
                  {formatEarnings(earningsDetail.totalEarnings)}
                </Text>
              </View>

              {/* Session List */}
              <View style={styles.sessionsList}>
                {earningsDetail.sessions.map((session) => (
                  <View 
                    key={session.id} 
                    style={[styles.sessionItem, { backgroundColor: theme.backgroundColor }]}
                  >
                    <View style={styles.sessionInfo}>
                      <Text style={[styles.sessionPatient, { color: theme.textColor }]}>
                        {session.patientName}
                      </Text>
                      <Text style={[styles.sessionDateTime, { color: theme.secondaryTextColor }]}>
                        {formatDate(session.date)} at {formatTime(session.time)}
                      </Text>
                    </View>
                    <View style={styles.sessionRight}>
                      <Text style={[styles.sessionAmount, { color: theme.textColor }]}>
                        {formatEarnings(session.amount)}
                      </Text>
                      <View style={[styles.sessionBadge, { backgroundColor: theme.greenLight }]}>
                        <Text style={[styles.sessionBadgeText, { color: theme.greenColor }]}>Completed</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptySubtitle, { color: theme.secondaryTextColor }]}>
                No session details available
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  overviewCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  loadingContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  monthlyList: {
    padding: 16,
  },
  monthlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  monthlyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthlySubtitle: {
    fontSize: 13,
  },
  monthlyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailContent: {
    padding: 16,
  },
  totalEarningsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  totalEarningsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalEarningsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sessionsList: {
    gap: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionPatient: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionDateTime: {
    fontSize: 12,
  },
  sessionRight: {
    alignItems: 'flex-end',
  },
  sessionAmount: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  sessionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

