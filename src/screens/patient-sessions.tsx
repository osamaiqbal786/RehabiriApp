import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  useColorScheme,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Session } from '../../types';
import { deleteSession } from '../../utils/mongoStorage';
import { useAppState } from '../hooks/useAppState';
import { exportSessionsToExcel } from '../../utils/exportUtils';
import SessionCard from '../../components/SessionCard';
import SessionEditModal from '../../components/SessionEditModal';
import { FileDown } from 'lucide-react-native';

export default function PatientSessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompletedSessions, setShowCompletedSessions] = useState(false);
  const [hideCancelled, setHideCancelled] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);

  // Get session and patient data from store instead of API calls
  const { todaySessions, upcomingSessions, pastSessions, patients } = useAppState();

  // Get route params
  const route = useRoute();
  const params = route.params as { patientId?: string } || {};
  const patientId = params.patientId;
  
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F2F2F7',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    cardBackground: isDarkMode ? '#2A2A2A' : 'white',
    borderColor: isDarkMode ? '#444444' : '#DDDDDD',
    primaryColor: '#0A84FF',
    secondaryColor: '#5856D6',
    inactiveColor: isDarkMode ? '#444444' : '#E5E5EA',
    inactiveTextColor: isDarkMode ? '#888888' : '#8E8E93',
    modalBg: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
  };

  const loadPatientInfo = useCallback(() => {
    if (!patientId) return;
    
    // Get patient name from store data instead of API call
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setPatientName(patient.name);
    }
  }, [patientId, patients]);

  const loadSessions = useCallback(() => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      
      // Get all sessions from store (today, upcoming, past)
      const allSessions = [...todaySessions, ...upcomingSessions, ...pastSessions];
      
      // Filter by patient ID
      const patientSessions = allSessions.filter(session => session.patientId === patientId);
      
      // Filter based on the selected tab (completed or upcoming)
      let filteredByStatus = patientSessions.filter(session => 
        showCompletedSessions ? (session.completed || session.cancelled) : (!session.completed && !session.cancelled)
      );
      
      // If showing completed sessions and hide cancelled is checked, filter out cancelled sessions
      if (showCompletedSessions && hideCancelled) {
        filteredByStatus = filteredByStatus.filter(session => !session.cancelled);
      }
      
      // Sort sessions by date and time
      const sortedSessions = filteredByStatus.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return showCompletedSessions 
          ? dateA.getTime() - dateB.getTime() // Ascending for completed (oldest first)
          : dateA.getTime() - dateB.getTime(); // Ascending for upcoming
      });
      
      setSessions(sortedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId, showCompletedSessions, hideCancelled, todaySessions, upcomingSessions, pastSessions]);

  useEffect(() => {
    loadPatientInfo();
  }, [loadPatientInfo]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const handleExportSessions = async () => {
    try {
      setLoading(true);
      
      if (sessions.length === 0) {
        Alert.alert('No Data', `There are no ${showCompletedSessions ? 'completed' : 'upcoming'} sessions to export`);
        setLoading(false);
        return;
      }
      
      const success = await exportSessionsToExcel(sessions, patientName);
      if (success) {
        Alert.alert('Success', 'Sessions exported successfully');
      } else {
        Alert.alert('Error', 'Failed to export sessions');
      }
    } catch (error) {
      console.error('Error exporting sessions:', error);
      Alert.alert('Error', 'Failed to export sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setSessionModalVisible(true);
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(sessionId);
              Alert.alert('Success', 'Session deleted successfully');
              loadSessions();
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete session');
            }
          }
        },
      ]
    );
  };

  const handleToggleComplete = async (_session: Session, _completed: boolean) => {
    Alert.alert('Toggle Complete', 'Session completion functionality will be implemented');
  };

  const handleSaveSession = async () => {
    setSessionModalVisible(false);
    setSelectedSession(undefined);
    // Refresh sessions after editing
    await loadSessions();
  };

  const renderSessionCard = ({ item }: { item: Session }) => (
    <SessionCard
      session={item}
      onEdit={handleEditSession}
      onDelete={handleDeleteSession}
      onToggleComplete={handleToggleComplete}
      showCompleteToggle={false}
      allowEdit={!showCompletedSessions} // Allow edit only for upcoming sessions
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={[styles.emptyStateText, { color: theme.textColor }]}>
        No {showCompletedSessions ? 'completed' : 'upcoming'} sessions found for {patientName}
      </Text>
    </View>
  );

  const renderTabButton = (title: string, isActive: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        {
          backgroundColor: isActive ? theme.primaryColor : theme.inactiveColor,
        }
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.tabButtonText,
          {
            color: isActive ? 'white' : theme.inactiveTextColor,
          }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      

      <View style={styles.content}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton('Upcoming', !showCompletedSessions, () => setShowCompletedSessions(false))}
          {renderTabButton('Completed', showCompletedSessions, () => setShowCompletedSessions(true))}
        </View>

        {/* Export Button */}
        {sessions.length > 0 && (
          <View style={styles.exportContainer}>
            <TouchableOpacity 
              style={[styles.exportButton, { backgroundColor: theme.primaryColor }]}
              onPress={handleExportSessions}
              activeOpacity={0.7}
            >
              <FileDown size={16} color="white" style={styles.exportIcon} />
              <Text style={styles.exportButtonText}>Export Sessions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sessions List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primaryColor} />
            <Text style={[styles.loadingText, { color: theme.textColor }]}>Loading sessions...</Text>
          </View>
        ) : sessions.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSessionCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Hide Cancelled Checkbox - Only show on Completed tab, at bottom */}
        {showCompletedSessions && (
          <View style={[styles.bottomCheckboxContainer, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setHideCancelled(!hideCancelled)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                { 
                  backgroundColor: hideCancelled ? theme.primaryColor : 'transparent',
                  borderColor: hideCancelled ? theme.primaryColor : theme.borderColor
                }
              ]}>
                {hideCancelled && <Text style={[styles.checkmark, { color: 'white' }]}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.textColor }]}>
                Hide Cancelled Sessions
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Session Edit Modal */}
      <SessionEditModal
        visible={sessionModalVisible}
        session={selectedSession}
        onClose={() => {
          setSessionModalVisible(false);
          setSelectedSession(undefined);
        }}
        onSave={handleSaveSession}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exportContainer: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  exportButton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportIcon: {
    marginRight: 8,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  listContent: {
    paddingBottom: 20,
  },
  bottomCheckboxContainer: {
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});