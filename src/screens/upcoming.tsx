import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Plus, Filter } from 'lucide-react-native';
import { Session, Patient } from '../../types';
import { getUpcomingSessions, updateSession, deleteSession, getFilteredSessions, getCurrentUserPatients } from '../../utils/mongoStorage';
import SessionCard from '../../components/SessionCard';
import SessionEditModal from '../../components/SessionEditModal';
import SessionFilter from '../../components/SessionFilter';
import PaymentModal from '../../components/PaymentModal';

export default function UpcomingScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState<Session | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // Get route params
  const route = useRoute();
  const params = route.params as { patientId?: string } || {};
  const patientId = params.patientId;

  // Get the device color scheme
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Create theme object based on the color scheme
  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F2F2F7',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    cardBackground: isDarkMode ? '#2A2A2A' : 'white',
    inputBackground: isDarkMode ? '#333333' : 'white',
    borderColor: isDarkMode ? '#444444' : '#DDDDDD',
    primaryColor: '#0A84FF',
    errorColor: '#FF453A',
    placeholderColor: isDarkMode ? '#888888' : '#999999',
    modalBg: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    separatorColor: isDarkMode ? '#333333' : '#EFEFEF',
  };

  const loadPatients = async () => {
    try {
      const patientsList = await getCurrentUserPatients();
      setPatients(patientsList);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadSessions = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      
      // If patientId is provided from route params, filter sessions by patient
      if (patientId && !filters) {
        setIsFiltered(true);
        
        const filter = {
          patientId: patientId
        };
        
        const filteredSessions = await getFilteredSessions(filter);
        // Filter to only include upcoming sessions (not completed, not cancelled)
        const upcomingSessions = filteredSessions.filter(session => !session.completed && !session.cancelled);
        // Sort sessions: today first, then by date and time
        const today = new Date().toISOString().split('T')[0];
        const sortedSessions = upcomingSessions.sort((a, b) => {
          const isTodayA = a.date === today;
          const isTodayB = b.date === today;
          
          // If one is today and the other isn't, today comes first
          if (isTodayA && !isTodayB) return -1;
          if (!isTodayA && isTodayB) return 1;
          
          // If both are today or both are not today, sort by date and time
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });
        
        setSessions(sortedSessions);
      } 
      // If filters are provided from the filter component
      else if (filters) {
        setIsFiltered(true);
        const filteredSessions = await getFilteredSessions(filters);
        // Filter to only include upcoming sessions (not completed, not cancelled)
        const upcomingSessions = filteredSessions.filter(session => !session.completed && !session.cancelled);
        // Sort sessions: today first, then by date and time
        const today = new Date().toISOString().split('T')[0];
        const sortedSessions = upcomingSessions.sort((a, b) => {
          const isTodayA = a.date === today;
          const isTodayB = b.date === today;
          
          // If one is today and the other isn't, today comes first
          if (isTodayA && !isTodayB) return -1;
          if (!isTodayA && isTodayB) return 1;
          
          // If both are today or both are not today, sort by date and time
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });
        setSessions(sortedSessions);
      } 
      // No filters, show all upcoming sessions
      else {
        setIsFiltered(false);
        const upcomingSessions = await getUpcomingSessions();
        // Sort sessions: today first, then by date and time
        const today = new Date().toISOString().split('T')[0];
        const sortedSessions = upcomingSessions.sort((a, b) => {
          const isTodayA = a.date === today;
          const isTodayB = b.date === today;
          
          // If one is today and the other isn't, today comes first
          if (isTodayA && !isTodayB) return -1;
          if (!isTodayA && isTodayB) return 1;
          
          // If both are today or both are not today, sort by date and time
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });
        setSessions(sortedSessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const handleApplyFilter = (filters: any) => {
    setIsFiltered(true);
    setShowFilter(false); // Hide filter after applying
    loadSessions(filters);
  };

  const handleClearFilter = () => {
    setIsFiltered(false);
    setShowFilter(false); // Hide filter after clearing
    loadSessions();
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await loadPatients();  // Load patients first
        loadSessions();        // Then load sessions
      };
      
      loadData();
    }, [loadSessions])
  );

  const handleAddSession = () => {
    setSelectedSession(undefined);
    setModalVisible(true);
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setModalVisible(true);
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

  const handleToggleComplete = async (session: Session, completed: boolean) => {
    if (completed) {
      // Prevent marking upcoming sessions as complete
      Alert.alert(
        'Cannot Complete',
        'Upcoming sessions cannot be marked as complete. Please wait until the session date has passed.',
        [{ text: 'OK' }]
      );
    } else {
      // If marking as incomplete, just update the session
      try {
        const updatedSession = { ...session, completed, amount: undefined };
        await updateSession(updatedSession);
        loadSessions();
      } catch (error) {
        console.error('Error updating session completion status:', error);
        Alert.alert('Error', 'Failed to update session status');
      }
    }
  };

  const handlePaymentConfirm = async (amount: number) => {
    if (!sessionToComplete) return;
    
    try {
      const updatedSession = { 
        ...sessionToComplete, 
        completed: true,
        amount: amount
      };
      await updateSession(updatedSession);
      setPaymentModalVisible(false);
      setSessionToComplete(null);
      loadSessions();
    } catch (error) {
      console.error('Error updating session with payment:', error);
      Alert.alert('Error', 'Failed to update session payment');
    }
  };

  const handlePaymentCancel = () => {
    setPaymentModalVisible(false);
    setSessionToComplete(null);
  };

  const handleSaveSession = async (_session: Session) => {
    setModalVisible(false);
    loadSessions();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          {isFiltered && patientId && (
            <TouchableOpacity 
              style={[styles.clearFilterButton, { backgroundColor: theme.borderColor }]}
              onPress={handleClearFilter}
            >
              <Text style={[styles.clearFilterText, { color: theme.textColor }]}>Clear Filter</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: theme.borderColor }]}
            onPress={() => setShowFilter(!showFilter)}
          >
            <Filter size={20} color={theme.textColor} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.primaryColor }]}
            onPress={handleAddSession}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <SessionFilter 
        patients={patients}
        onApplyFilter={handleApplyFilter}
        onClearFilter={handleClearFilter}
        visible={showFilter}
        onClose={() => setShowFilter(false)}
      />

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={{ color: theme.textColor, marginTop: 10 }}>Loading sessions...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={[styles.noSessionsText, { color: theme.textColor }]}>No upcoming sessions scheduled</Text>
          <TouchableOpacity 
            style={[styles.addSessionButton, { backgroundColor: theme.primaryColor }]}
            onPress={handleAddSession}
          >
            <Text style={styles.addSessionButtonText}>Add New Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SessionCard
              key={item.id}
              session={item}
              isUpcoming={true}
              onEdit={(session) => handleEditSession(session)}
              onDelete={(sessionId) => handleDeleteSession(sessionId)}
              onToggleComplete={(session, completed) => handleToggleComplete(session, completed)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <SessionEditModal
        visible={modalVisible}
        session={selectedSession}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveSession}
      />

      {/* Payment Modal */}
      {sessionToComplete && (
        <PaymentModal
          visible={paymentModalVisible}
          session={sessionToComplete}
          onConfirm={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginRight: 10,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSessionsText: {
    fontSize: 16,
    marginBottom: 20,
  },
  addSessionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addSessionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});