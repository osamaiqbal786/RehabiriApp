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
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Plus, Filter } from 'lucide-react-native';
import { Session } from '../../types';
import { updateSession, deleteSession } from '../../utils/mongoStorage';
import { useAppState } from '../hooks/useAppState';
import { useDataRefresh } from '../hooks/useDataRefresh';
import SessionCard from '../../components/SessionCard';
import SessionEditModal from '../../components/SessionEditModal';
import SessionFilter from '../../components/SessionFilter';
import DataStatusBar from '../components/DataStatusBar';
import StatusMessage from '../components/StatusMessage';

export default function UpcomingScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [isFiltered, setIsFiltered] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);

  // Use global state instead of local state
  const { 
    upcomingSessions, 
    patients,
    sessionsLoading, 
    sessionsError,
    sessionsRefreshFailed,
    dispatch 
  } = useAppState();
  
  const { refreshSessions } = useDataRefresh();

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

  // Local filtering function - no API calls needed!
  const filterSessionsLocally = useCallback((sessions: Session[], filters: any) => {
    let filtered = [...sessions];

    // Filter by patient ID
    if (filters.patientId) {
      filtered = filtered.filter(session => session.patientId === filters.patientId);
    }

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(session => session.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(session => session.date <= filters.endDate);
    }

    // Filter by cancelled status
    if (filters.includeCancelled === false) {
      filtered = filtered.filter(session => !session.cancelled);
    }

    // For upcoming screen, ensure we only show upcoming sessions (not completed/cancelled)
    filtered = filtered.filter(session => !session.completed && !session.cancelled);

    return filtered;
  }, []);

  // Handle filtering logic - now using local filtering!
  const applyFilters = useCallback((filters?: any) => {
    try {
      if (patientId && !filters) {
        // Filter by patient from route params
        setIsFiltered(true);
        const filter = { patientId: patientId };
        const filteredSessionsData = filterSessionsLocally(upcomingSessions, filter);
        setFilteredSessions(filteredSessionsData);
      } else if (filters) {
        // Filter by provided filters
        setIsFiltered(true);
        const filteredSessionsData = filterSessionsLocally(upcomingSessions, filters);
        setFilteredSessions(filteredSessionsData);
      } else {
        // No filters, use global state
        setIsFiltered(false);
        setFilteredSessions([]);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [patientId, upcomingSessions, filterSessionsLocally]);

  // Get the sessions to display (filtered or global)
  const displaySessions = isFiltered ? filteredSessions : upcomingSessions;

  const handleApplyFilter = (filters: any) => {
    setShowFilter(false); // Hide filter after applying
    applyFilters(filters);
  };

  const handleClearFilter = () => {
    setIsFiltered(false);
    setShowFilter(false); // Hide filter after clearing
    setFilteredSessions([]);
  };

  // Apply filters when component mounts or patientId changes
  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
              // Trigger refresh of sessions data
              dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
              // Reapply filters if needed
              if (isFiltered) {
                applyFilters();
              }
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
        // Trigger refresh of sessions data
        dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
        // Reapply filters if needed
        if (isFiltered) {
          applyFilters();
        }
      } catch (error) {
        console.error('Error updating session completion status:', error);
        Alert.alert('Error', 'Failed to update session status');
      }
    }
  };


  const handleSaveSession = async (_session: Session) => {
    setModalVisible(false);
    // Trigger refresh of sessions data
    dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
    // Reapply filters if needed
    if (isFiltered) {
      applyFilters();
    }
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
        showCancelledOption={false}
        resetOnOpen={false} // Don't reset values when reopening modal
      />

      {/* Data Status Bar */}
      <DataStatusBar 
        onRefresh={refreshSessions}
        dataType="sessions"
      />

      {/* Refresh Failure Message */}
      <StatusMessage 
        visible={sessionsRefreshFailed} 
        type="error" 
        message="Failed to refresh data" 
      />

      {sessionsLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={[styles.loadingText, { color: theme.textColor }]}>Loading sessions...</Text>
        </View>
      ) : sessionsError ? (
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: theme.errorColor }]}>
            Error: {sessionsError}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primaryColor }]}
            onPress={refreshSessions}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : displaySessions.length === 0 ? (
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
          data={displaySessions}
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
          refreshControl={
            <RefreshControl
              refreshing={sessionsLoading}
              onRefresh={refreshSessions}
              tintColor={theme.primaryColor}
            />
          }
        />
      )}

      <SessionEditModal
        visible={modalVisible}
        session={selectedSession}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveSession}
      />

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
  loadingText: {
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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