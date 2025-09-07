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
import { getPatientSessions, getPatientById, deleteSession } from '../../utils/mongoStorage';
import { exportSessionsToExcel } from '../../utils/exportUtils';
import SessionCard from '../../components/SessionCard';
import SessionEditModal from '../../components/SessionEditModal';
import { FileDown } from 'lucide-react-native';

export default function PatientSessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPastSessions, setShowPastSessions] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);

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

  const loadPatientInfo = useCallback(async () => {
    if (!patientId) return;
    
    try {
      const patient = await getPatientById(patientId);
      if (patient) {
        setPatientName(patient.name);
      }
    } catch (error) {
      console.error('Error loading patient info:', error);
    }
  }, [patientId]);

  const loadSessions = useCallback(async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      
      // Use the new getPatientSessions function which filters by both patientId and userId
      const allSessions = await getPatientSessions(patientId);
      
      // Filter based on the selected tab (past or upcoming)
      const filteredByStatus = allSessions.filter(session => 
        showPastSessions ? (session.completed || session.cancelled) : (!session.completed && !session.cancelled)
      );
      
      // Sort sessions by date and time
      const sortedSessions = filteredByStatus.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return showPastSessions 
          ? dateB.getTime() - dateA.getTime() // Descending for past
          : dateA.getTime() - dateB.getTime(); // Ascending for upcoming
      });
      
      setSessions(sortedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId, showPastSessions]);

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
        Alert.alert('No Data', `There are no ${showPastSessions ? 'past' : 'upcoming'} sessions to export`);
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
      allowEdit={!showPastSessions} // Allow edit only for upcoming sessions
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={[styles.emptyStateText, { color: theme.textColor }]}>
        No {showPastSessions ? 'past' : 'upcoming'} sessions found for {patientName}
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
          {renderTabButton('Upcoming', !showPastSessions, () => setShowPastSessions(false))}
          {renderTabButton('Past', showPastSessions, () => setShowPastSessions(true))}
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
});