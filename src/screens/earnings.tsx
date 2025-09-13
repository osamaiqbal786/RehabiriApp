import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronRight, DollarSign } from 'lucide-react-native';
import { getMonthlyEarnings } from '../../utils/mongoStorage';

interface MonthlyEarning {
  month: string;
  year: number;
  totalEarnings: number;
  sessionCount: number;
}

export default function EarningsScreen() {
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F2F2F7',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    cardBackground: isDarkMode ? '#2A2A2A' : 'white',
    borderColor: isDarkMode ? '#444444' : '#DDDDDD',
    primaryColor: '#0A84FF',
    earningsColor: '#34C759',
    secondaryTextColor: isDarkMode ? '#8E8E93' : '#6D6D70',
  };

  const loadMonthlyEarnings = async () => {
    try {
      setLoading(true);
      const earnings = await getMonthlyEarnings();
      setMonthlyEarnings(earnings);
    } catch (error) {
      console.error('Error loading monthly earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMonthlyEarnings();
    }, [])
  );

  const formatMonthYear = (month: string, year: number): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  };

  const formatEarnings = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const handleMonthPress = (monthEarning: MonthlyEarning) => {
    navigation.navigate('EarningsDetail' as never, {
      year: monthEarning.year,
      month: monthEarning.month,
    } as never);
  };

  const renderMonthItem = ({ item }: { item: MonthlyEarning }) => (
    <TouchableOpacity 
      style={[styles.monthCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}
      onPress={() => handleMonthPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.monthInfo}>
        <View style={styles.monthHeader}>
          <Text style={[styles.monthText, { color: theme.textColor }]}>
            {formatMonthYear(item.month, item.year)}
          </Text>
          <Text style={[styles.sessionCount, { color: theme.secondaryTextColor }]}>
            {item.sessionCount} session{item.sessionCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={[styles.earningsAmount, { color: theme.earningsColor }]}>
          {formatEarnings(item.totalEarnings)}
        </Text>
      </View>
      <ChevronRight size={20} color={theme.secondaryTextColor} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Text style={[styles.loadingText, { color: theme.textColor }]}>Loading earnings...</Text>
      </View>
    );
  }

  if (monthlyEarnings.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.backgroundColor }]}>
        <DollarSign size={64} color={theme.secondaryTextColor} />
        <Text style={[styles.emptyTitle, { color: theme.textColor }]}>No Earnings Yet</Text>
        <Text style={[styles.emptySubtitle, { color: theme.secondaryTextColor }]}>
          Complete some sessions to see your monthly earnings here
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textColor }]}>Monthly Earnings</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryTextColor }]}>
          Tap on a month to see details
        </Text>
      </View>

      <FlatList
        data={monthlyEarnings}
        keyExtractor={(item, index) => {
          if (item.year && item.month) {
            return `${item.year}-${item.month}`;
          }
          return `month-${index}`;
        }}
        renderItem={renderMonthItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    marginBottom: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthInfo: {
    flex: 1,
  },
  monthHeader: {
    marginBottom: 5,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  sessionCount: {
    fontSize: 14,
    marginTop: 2,
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: 'bold',
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
