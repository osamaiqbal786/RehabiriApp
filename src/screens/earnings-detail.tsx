import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { DollarSign, Calendar, Clock, User } from 'lucide-react-native';
import { getMonthlyEarningsDetail } from '../../utils/mongoStorage';
import CelebrationAnimation from '../../components/CelebrationAnimation';

interface Session {
  id: string;
  patientName: string;
  date: string;
  time: string;
  amount: number;
}

interface MonthlyEarningsDetail {
  month: string;
  year: number;
  totalEarnings: number;
  sessionCount: number;
  sessions: Session[];
}

export default function EarningsDetailScreen() {
  const [earningsDetail, setEarningsDetail] = useState<MonthlyEarningsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const route = useRoute();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const { year, month } = route.params as { year: number; month: string };

  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F2F2F7',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    cardBackground: isDarkMode ? '#2A2A2A' : 'white',
    borderColor: isDarkMode ? '#444444' : '#DDDDDD',
    primaryColor: '#0A84FF',
    earningsColor: '#34C759',
    secondaryTextColor: isDarkMode ? '#8E8E93' : '#6D6D70',
  };

  useFocusEffect(
    useCallback(() => {
      const loadEarningsDetail = async () => {
        try {
          setLoading(true);
          const detail = await getMonthlyEarningsDetail(year, month);
          setEarningsDetail(detail);
          
          // Show celebration animation after a short delay
          setTimeout(() => {
            setShowCelebration(true);
          }, 500);
        } catch (error) {
          console.error('Error loading earnings detail:', error);
        } finally {
          setLoading(false);
        }
      };

      loadEarningsDetail();
    }, [year, month])
  );

  const formatMonthYear = (monthStr: string, yearNum: number): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(monthStr, 10) - 1;
    return `${monthNames[monthIndex]} ${yearNum}`;
  };

  const formatEarnings = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  const renderSessionItem = ({ item }: { item: Session }) => (
    <View style={[styles.sessionCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
      <View style={styles.sessionHeader}>
        <View style={styles.patientInfo}>
          <User size={16} color={theme.secondaryTextColor} />
          <Text style={[styles.patientName, { color: theme.textColor }]}>{item.patientName}</Text>
        </View>
        <Text style={[styles.sessionAmount, { color: theme.earningsColor }]}>
          {formatEarnings(item.amount)}
        </Text>
      </View>
      
      <View style={styles.sessionDetails}>
        <View style={styles.dateTimeInfo}>
          <Calendar size={14} color={theme.secondaryTextColor} />
          <Text style={[styles.dateText, { color: theme.secondaryTextColor }]}>
            {formatDate(item.date)}
          </Text>
        </View>
        <View style={styles.dateTimeInfo}>
          <Clock size={14} color={theme.secondaryTextColor} />
          <Text style={[styles.timeText, { color: theme.secondaryTextColor }]}>
            {formatTime(item.time)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={[styles.loadingText, { color: theme.textColor }]}>Loading earnings...</Text>
      </View>
    );
  }

  if (!earningsDetail) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.backgroundColor }]}>
        <DollarSign size={64} color={theme.secondaryTextColor} />
        <Text style={[styles.emptyTitle, { color: theme.textColor }]}>No Data Found</Text>
        <Text style={[styles.emptySubtitle, { color: theme.secondaryTextColor }]}>
          No earnings data available for this month
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Celebration Animation */}
      <CelebrationAnimation 
        visible={showCelebration} 
        onAnimationComplete={handleCelebrationComplete}
      />

      {/* Header with total earnings */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
        <Text style={[styles.monthTitle, { color: theme.textColor }]}>
          {formatMonthYear(earningsDetail.month, earningsDetail.year)}
        </Text>
        <Text style={[styles.totalEarnings, { color: theme.earningsColor }]}>
          {formatEarnings(earningsDetail.totalEarnings)}
        </Text>
        <Text style={[styles.sessionCount, { color: theme.secondaryTextColor }]}>
          {earningsDetail.sessionCount} completed session{earningsDetail.sessionCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Sessions list */}
      <View style={styles.sessionsSection}>
        <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Sessions</Text>
        <FlatList
          data={earningsDetail.sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.sessionsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totalEarnings: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sessionCount: {
    fontSize: 16,
  },
  sessionsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  sessionsList: {
    paddingBottom: 20,
  },
  sessionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sessionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    marginLeft: 6,
  },
  timeText: {
    fontSize: 14,
    marginLeft: 6,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
