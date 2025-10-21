import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../hooks/useAppState';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { useAuth } from '../../utils/AuthContext';
import { Users, Calendar, Activity, TrendingUp, RefreshCw } from 'lucide-react-native';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  
  const { 
    todaySessions, 
    upcomingSessions, 
    pastSessions,
    patients
  } = useAppState();
  
  const { refreshAll } = useDataRefresh();

  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F7FA',
    cardBackground: isDarkMode ? '#2A2A2A' : 'white',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    secondaryTextColor: isDarkMode ? '#B0B0B0' : '#6B7280',
    primaryColor: isDarkMode ? '#0A84FF' : '#00143f',
    borderColor: isDarkMode ? '#444444' : '#E5E7EB',
    blueGradientStart: isDarkMode ? '#28303A' : '#CCE5FF',
  };

  // Calculate statistics
  const getPatientStats = () => {
    const totalPatients = patients.length;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentPatients = patients.filter(patient => {
      const createdAt = new Date(patient.createdAt);
      return createdAt >= thirtyDaysAgo;
    }).length;
    
    return { totalPatients, recentPatients };
  };

  const getSessionStats = () => {
    const allSessions = [...todaySessions, ...upcomingSessions, ...pastSessions];
    
    // Remove duplicates by ID
    const uniqueSessionsMap = new Map();
    allSessions.forEach(session => {
      uniqueSessionsMap.set(session.id, session);
    });
    const uniqueSessions = Array.from(uniqueSessionsMap.values());
    
    const totalSessions = uniqueSessions.length;
    
    // Sessions this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const sessionsThisMonth = uniqueSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
    }).length;
    
    // Today's sessions
    const todayCount = todaySessions.length;
    
    // Upcoming sessions
    const upcomingCount = upcomingSessions.length;
    
    // Completed sessions this month
    const completedThisMonth = uniqueSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return session.completed && 
             sessionDate.getMonth() === currentMonth && 
             sessionDate.getFullYear() === currentYear;
    }).length;
    
    return { 
      totalSessions, 
      sessionsThisMonth, 
      todayCount, 
      upcomingCount, 
      completedThisMonth 
    };
  };

  const patientStats = getPatientStats();
  const sessionStats = getSessionStats();

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };


  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primaryColor}
        />
      }
    >
      {/* Welcome Section */}
      <View style={[styles.welcomeCard, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.welcomeHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.welcomeTitle, { color: theme.textColor }]}>
              Welcome back! 👋
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.secondaryTextColor }]}>
              Your work at a glance
            </Text>
          </View>
        </View>
      </View>

      {/* Sessions Card */}
      <TouchableOpacity 
        style={[styles.statCard, styles.sessionsCard, { backgroundColor: theme.cardBackground }]}
        onPress={() => navigation.navigate('Today' as never)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, styles.sessionsIcon]}>
              <Calendar size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: theme.textColor }]}>Sessions</Text>
              <Text style={[styles.cardSubtitle, { color: theme.secondaryTextColor }]}>Track all therapy sessions</Text>
            </View>
          </View>
          <Text style={[styles.viewButton, { color: theme.primaryColor }]}>View →</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.statBoxPurple]}>
            <Text style={styles.statNumber}>{sessionStats.sessionsThisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxBrand]}>
            <Text style={styles.statNumber}>{sessionStats.todayCount}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.statBoxGreen]}>
            <Text style={styles.statNumber}>{sessionStats.completedThisMonth}</Text>
            <Text style={styles.statLabel}>✓ Completed</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxOrange]}>
            <Text style={styles.statNumber}>{sessionStats.upcomingCount}</Text>
            <Text style={styles.statLabel}>⏰ Upcoming</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Patients Card */}
      <TouchableOpacity 
        style={[styles.statCard, styles.patientsCard, { backgroundColor: theme.cardBackground }]}
        onPress={() => navigation.navigate('Patients' as never)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, styles.patientsIcon]}>
              <Users size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: theme.textColor }]}>Patients</Text>
              <Text style={[styles.cardSubtitle, { color: theme.secondaryTextColor }]}>Total patient management</Text>
            </View>
          </View>
          <Text style={[styles.viewButton, { color: theme.primaryColor }]}>View →</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.statBoxWhite, { borderColor: theme.borderColor }]}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{patientStats.totalPatients}</Text>
            <Text style={[styles.statLabel, { color: theme.textColor }]}>Total Patients</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxGreenLight]}>
            <Text style={styles.statNumber}>+{patientStats.recentPatients}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Analytics Card */}
      <TouchableOpacity 
        style={[styles.statCard, styles.analyticsCard, { backgroundColor: theme.cardBackground }]}
        onPress={() => navigation.navigate('Analytics' as never)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, styles.analyticsIcon]}>
              <TrendingUp size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: theme.textColor }]}>Analytics</Text>
              <Text style={[styles.cardSubtitle, { color: theme.secondaryTextColor }]}>Track performance & earnings</Text>
            </View>
          </View>
          <Text style={[styles.viewButton, { color: theme.primaryColor }]}>View →</Text>
        </View>
        
        <View style={[styles.analyticsContent, { backgroundColor: theme.blueGradientStart }]}>
          <Text style={[styles.analyticsText, { color: isDarkMode ? '#60A5FA' : '#1E40AF' }]}>
            📊 View detailed insights on sessions, earnings, and clinic performance
          </Text>
        </View>
      </TouchableOpacity>

      {/* Recent Activity */}
      <View style={[styles.activityCard, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.activityHeader}>
          <View style={styles.activityHeaderLeft}>
            <View style={[styles.iconContainer, styles.activityIcon]}>
              <Activity size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: theme.textColor }]}>Recent Activity</Text>
              <Text style={[styles.cardSubtitle, { color: theme.secondaryTextColor }]}>Today & upcoming sessions</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => refreshAll()}
            style={styles.refreshButton}
          >
            <RefreshCw size={18} color={theme.primaryColor} />
          </TouchableOpacity>
        </View>

        {/* Activity List */}
        <ScrollView style={styles.activityList} nestedScrollEnabled={true}>
          {(() => {
            const allSessions = [...todaySessions, ...upcomingSessions];
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            // Map each session to include its activity type
            const activityWithTypes = allSessions.map(session => {
              let activityType = '';
              
              if (session.completed) {
                activityType = 'completed';
              } else if (session.cancelled) {
                activityType = 'cancelled';
              } else if (session.date === todayStr) {
                activityType = 'scheduled';
              } else {
                activityType = 'upcoming';
              }
              
              return {
                ...session,
                activityType: activityType
              };
            });

            // Sort by last activity (use updatedAt if available, otherwise createdAt)
            const sortedActivity = activityWithTypes.sort((a, b) => {
              const aTime = new Date(a.updatedAt || a.createdAt).getTime();
              const bTime = new Date(b.updatedAt || b.createdAt).getTime();
              return bTime - aTime;
            }); // Show all activities

            if (sortedActivity.length === 0) {
              return (
                <View style={styles.emptyActivity}>
                  <Text style={[styles.emptyText, { color: theme.secondaryTextColor }]}>No activity yet</Text>
                  <Text style={[styles.emptySubtext, { color: theme.secondaryTextColor }]}>Updates will appear here</Text>
                </View>
              );
            }

            return sortedActivity.map(session => {
              let activityText = '';
              let activityIcon = '';
              let iconColor = '';
              let iconBg = '';
              
              switch (session.activityType) {
                case 'completed':
                  activityText = 'Session completed';
                  activityIcon = '✓';
                  iconColor = '#10B981';
                  iconBg = '#D1FAE5';
                  break;
                case 'cancelled':
                  activityText = 'Session cancelled';
                  activityIcon = '✕';
                  iconColor = '#EF4444';
                  iconBg = '#FEE2E2';
                  break;
                case 'scheduled':
                  activityText = "Today's session";
                  activityIcon = '📅';
                  iconColor = '#8B5CF6';
                  iconBg = '#EDE9FE';
                  break;
                case 'upcoming':
                  activityText = 'Upcoming session';
                  activityIcon = '🔜';
                  iconColor = '#3B82F6';
                  iconBg = '#DBEAFE';
                  break;
                default:
                  activityText = 'Session';
                  activityIcon = '📅';
                  iconColor = '#6B7280';
                  iconBg = '#F3F4F6';
              }

              return (
                <View key={session.id} style={[styles.activityItem, { backgroundColor: isDarkMode ? '#333333' : '#F9FAFB', borderColor: theme.borderColor }]}>
                  <View style={[styles.activityIconContainer, { backgroundColor: iconBg }]}>
                    <Text style={styles.activityIconText}>{activityIcon}</Text>
                  </View>
                  <View style={styles.activityContent}>
                    <View style={styles.activityTop}>
                      <View style={[styles.patientAvatar, { backgroundColor: theme.primaryColor }]}>
                        <Text style={styles.patientAvatarText}>{session.patientName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.activityTextContainer}>
                        <Text style={[styles.patientName, { color: theme.textColor }]}>{session.patientName}</Text>
                        <Text style={[styles.activityText, { color: theme.secondaryTextColor }]}>{activityText}</Text>
                      </View>
                    </View>
                    <View style={styles.activityBottom}>
                      <Text style={[styles.activityTime, { color: theme.secondaryTextColor }]}>
                        🕐 {session.time}
                      </Text>
                    </View>
                    <View style={styles.statusBadgeContainer}>
                      <View style={[styles.statusBadge, { backgroundColor: iconBg }]}>
                        <Text style={[styles.statusBadgeText, { color: iconColor }]}>
                          {session.completed ? '✓ Done' : session.cancelled ? '✕ Cancelled' : '📅 Scheduled'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            });
          })()}
        </ScrollView>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
  },
  statCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  patientsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  analyticsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  analyticsContent: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  analyticsText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  analyticsIcon: {
    backgroundColor: '#3B82F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionsIcon: {
    backgroundColor: '#8B5CF6',
  },
  patientsIcon: {
    backgroundColor: '#10B981',
  },
  activityIcon: {
    backgroundColor: '#6366F1',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  viewButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  statBoxPurple: {
    backgroundColor: '#F3E8FF',
  },
  statBoxBrand: {
    backgroundColor: '#E6EAF0',
  },
  statBoxGreen: {
    backgroundColor: '#D1FAE5',
  },
  statBoxOrange: {
    backgroundColor: '#FED7AA',
  },
  statBoxWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
  },
  statBoxGreenLight: {
    backgroundColor: '#D1FAE5',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activityList: {
    gap: 8,
    maxHeight: 400,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  patientAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activityTextContainer: {
    flex: 1,
  },
  patientName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  activityText: {
    fontSize: 12,
  },
  activityBottom: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 12,
  },
  activityTherapist: {
    fontSize: 12,
  },
  statusBadgeContainer: {
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyActivity: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
  },
});

