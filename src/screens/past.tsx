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
  RefreshControl
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { FileDown, Filter } from 'lucide-react-native';
import { Session } from '../../types';
import { deleteSession, getFilteredSessions, updateSession } from '../../utils/mongoStorage';
import { useAppState } from '../hooks/useAppState';
import { useDataRefresh } from '../hooks/useDataRefresh';
import SessionCard from '../../components/SessionCard';
import SessionEditModal from '../../components/SessionEditModal';
import SessionFilter from '../../components/SessionFilter';
import { exportSessionsToExcel } from '../../utils/exportUtils';
import PaymentModal from '../../components/PaymentModal';
import DataStatusBar from '../components/DataStatusBar';

export default function PastScreen() {
  const [isFiltered, setIsFiltered] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState<Session | null>(null);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);

  // Use global state instead of local state
  const { 
    pastSessions, 
    patients,
    sessionsLoading, 
    sessionsError,
    dispatch 
  } = useAppState();
  
  const { refreshSessions } = useDataRefresh();

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
    inputBackground: isDarkMode ? '#333333' : 'white',
    borderColor: isDarkMode ? '#444444' : '#DDDDDD',
    primaryColor: '#0A84FF',
    errorColor: '#FF453A',
    placeholderColor: isDarkMode ? '#888888' : '#999999',
    modalBg: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    separatorColor: isDarkMode ? '#333333' : '#EFEFEF',
  };

  // Handle filtering logic
  const applyFilters = useCallback(async (filters?: any) => {
    try {
      if (patientId && !filters) {
        // Filter by patient from route params
        setIsFiltered(true);
        const filter = { patientId: patientId };
        const filteredSessionsData = await getFilteredSessions(filter);
        setFilteredSessions(filteredSessionsData);
      } else if (filters) {
        // Filter by provided filters
        setIsFiltered(true);
        const filteredSessionsData = await getFilteredSessions(filters);
        setFilteredSessions(filteredSessionsData);
      } else {
        // No filters, use global state
        setIsFiltered(false);
        setFilteredSessions([]);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [patientId]);

  // Get the sessions to display (filtered or global)
  const displaySessions = isFiltered ? filteredSessions : pastSessions;

  const handleApplyFilter = (filters: any) => {
    setShowFilter(false); // Hide filter after applying
    applyFilters(filters);
  };

  const handleClearFilter = () => {
    setIsFiltered(false);
    setShowFilter(false); // Hide filter after clearing
    setFilteredSessions([]);
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
    // Only allow marking as complete, not reverting back to incomplete
    if (completed && !session.completed) {
      // If marking as complete, show payment modal
      setSessionToComplete(session);
      setPaymentModalVisible(true);
    } else if (!completed && session.completed) {
      // If trying to mark a completed session as incomplete, show an alert
      Alert.alert('Info', 'Completed sessions cannot be marked as incomplete. You can delete the session if needed.');
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
      // Trigger refresh of sessions data
      dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
      // Reapply filters if needed
      if (isFiltered) {
        applyFilters();
      }
    } catch (error) {
      console.error('Error updating session with payment:', error);
      Alert.alert('Error', 'Failed to update session payment');
    }
  };

  const handlePaymentCancel = () => {
    setPaymentModalVisible(false);
    setSessionToComplete(null);
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setSessionModalVisible(true);
  };

  const handleSaveSession = async (_session: Session) => {
    setSessionModalVisible(false);
    setSelectedSession(undefined);
    // Trigger refresh of sessions data
    dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
    // Reapply filters if needed
    if (isFiltered) {
      applyFilters();
    }
  };

  // Apply filters when component mounts or patientId changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleExportSessions = async () => {
    try {
      if (displaySessions.length === 0) {
        Alert.alert('No Data', 'There are no past sessions to export');
        return;
      }
      
      // For all sessions, use "All Patients" as the name
      const exportName = "All Patients";
      
      const success = await exportSessionsToExcel(displaySessions, exportName);
      if (success) {
        Alert.alert('Success', 'Sessions exported successfully');
      } else {
        Alert.alert('Error', 'Failed to export sessions');
      }
    } catch (error) {
      console.error('Error exporting sessions:', error);
      Alert.alert('Error', 'Failed to export sessions');
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
            style={[styles.exportButton, { backgroundColor: theme.primaryColor }]}
            onPress={handleExportSessions}
            activeOpacity={0.7}
          >
            <FileDown size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <SessionFilter 
        patients={patients}
        onApplyFilter={handleApplyFilter}
        onClearFilter={handleClearFilter}
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        showCancelledOption={true}
      />

      {/* Data Status Bar */}
      <DataStatusBar 
        onRefresh={refreshSessions}
        dataType="sessions"
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
          <Text style={[styles.noSessionsText, { color: theme.textColor }]}>No past sessions found</Text>
        </View>
      ) : (
        <FlatList
          data={displaySessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // Allow editing only for unmarked sessions (not completed and not cancelled)
            const allowEdit = !item.completed && !item.cancelled;
            
            return (
              <SessionCard
                session={item}
                onEdit={allowEdit ? (session) => handleEditSession(session) : () => Alert.alert('Info', 'Cannot edit completed or cancelled sessions')}
                onDelete={(sessionId) => handleDeleteSession(sessionId)} 
                onToggleComplete={(session, completed) => {
                  // Only allow marking incomplete sessions as complete
                  if (session.completed && !completed) {
                    Alert.alert('Info', 'Completed sessions cannot be marked as incomplete. You can delete the session if needed.');
                  } else if (!session.completed && completed) {
                    handleToggleComplete(session, completed);
                  }
                }}
                allowEdit={allowEdit}
              />
            );
          }}
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

      {/* Payment Modal */}
      {sessionToComplete && (
        <PaymentModal
          visible={paymentModalVisible}
          session={sessionToComplete}
          onConfirm={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
        />
      )}

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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
  exportButton: {
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
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
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
    opacity: 0.7,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});