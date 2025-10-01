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
import { deleteSession, updateSession, getPastSessions } from '../../utils/mongoStorage';
import { useAppState } from '../hooks/useAppState';
import { useDataRefresh } from '../hooks/useDataRefresh';
import SessionCard from '../../components/SessionCard';
import SessionEditModal from '../../components/SessionEditModal';
import SessionFilter from '../../components/SessionFilter';
import { exportSessionsToExcel } from '../../utils/exportUtils';
import PaymentModal from '../../components/PaymentModal';
import DataStatusBar from '../components/DataStatusBar';
import StatusMessage from '../components/StatusMessage';

export default function PastScreen() {
  const [isFiltered, setIsFiltered] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState<Session | null>(null);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Use global state instead of local state
  const { 
    pastSessions, 
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

  // Helper function to validate date range (max 90 days)
  const validateDateRange = (startDate: string, endDate: string): { isValid: boolean; adjustedEndDate?: string } => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 90) {
      // Auto-adjust end date to 90 days from start date
      const adjustedEnd = new Date(start);
      adjustedEnd.setDate(adjustedEnd.getDate() + 90);
      return { isValid: false, adjustedEndDate: adjustedEnd.toISOString().split('T')[0] };
    }
    
    return { isValid: true };
  };

  // Helper function to check if BOTH start and end dates are within the 90-day fetched range
  const isWithinThreeMonthCache = (startDate: string, endDate: string): boolean => {
    const today = new Date();
    const userDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    // Calculate the 90-day range that was fetched
    const todayObj = new Date(userDate + 'T12:00:00');
    const ninetyDaysAgo = new Date(todayObj);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const yesterday = new Date(todayObj);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const fetchedStartDate = ninetyDaysAgo.toISOString().split('T')[0];
    const fetchedEndDate = yesterday.toISOString().split('T')[0];
    
    // Both start and end dates must be within the fetched range
    return startDate >= fetchedStartDate && startDate <= fetchedEndDate && 
           endDate >= fetchedStartDate && endDate <= fetchedEndDate;
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

    return filtered;
  }, []);

  // Handle filtering logic - now using local filtering!
  const applyFilters = useCallback((filters?: any) => {
    try {
      // Store current filters for export
      setCurrentFilters(filters);
      
      if (patientId && !filters) {
        // Filter by patient from route params
        setIsFiltered(true);
        const filter = { patientId: patientId };
        const filteredSessionsData = filterSessionsLocally(pastSessions, filter);
        setFilteredSessions(filteredSessionsData);
      } else if (filters) {
        // Filter by provided filters
        setIsFiltered(true);
        const filteredSessionsData = filterSessionsLocally(pastSessions, filters);
        setFilteredSessions(filteredSessionsData);
      } else {
        // No filters, use global state
        setIsFiltered(false);
        setFilteredSessions([]);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [patientId, pastSessions, filterSessionsLocally]);

  // Get the sessions to display (filtered or global)
  const displaySessions = isFiltered ? filteredSessions : pastSessions;

  const handleApplyFilter = async (filters: any) => {
    setShowFilter(false); // Hide filter after applying
    
    try {
      // If filters include date range, check if we need to fetch from server
      if (filters.startDate && filters.endDate) {
        const validation = validateDateRange(filters.startDate, filters.endDate);
        
        if (!validation.isValid) {
          // Show alert for auto-adjustment
          Alert.alert(
            'Date Range Adjusted',
            `Date range exceeds 90 days. End date has been adjusted to ${validation.adjustedEndDate}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Apply filter with adjusted date
                  const adjustedFilters = { ...filters, endDate: validation.adjustedEndDate };
                  applyFilters(adjustedFilters);
                }
              }
            ]
          );
          return;
        }
        
        // Check if the range is within our cached 90-day data
        if (isWithinThreeMonthCache(filters.startDate, filters.endDate)) {
          // Use local store data
          applyFilters(filters);
        } else {
          // Fetch from server with the specified date range
          const today = new Date();
          const userDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
          
          const serverSessions = await getPastSessions(userDate, filters.startDate, filters.endDate, filters.includeCancelled);
          
          // Apply additional filters (patient) to server data
          let filteredServerSessions = serverSessions;
          if (filters.patientId) {
            filteredServerSessions = serverSessions.filter(session => session.patientId === filters.patientId);
          }
          
          setIsFiltered(true);
          setFilteredSessions(filteredServerSessions);
          setCurrentFilters(filters); // Store filters for export
        }
      } else {
        // No date range, use local filtering
        applyFilters(filters);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      Alert.alert('Error', 'Failed to apply filters. Please try again.');
    }
  };

  const handleClearFilter = () => {
    setIsFiltered(false);
    setShowFilter(false); // Hide filter after clearing
    setFilteredSessions([]);
    setCurrentFilters(null); // Clear current filters
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
    
    setIsPaymentLoading(true);
    
    try {
      const updatedSession = { 
        ...sessionToComplete, 
        completed: true,
        amount: amount
      };
      await updateSession(updatedSession);
      // Trigger refresh of sessions data
      dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
      // Reapply filters if needed
      if (isFiltered) {
        applyFilters();
      }
      
      // Close modal after successful update
      setPaymentModalVisible(false);
      setSessionToComplete(null);
    } catch (error) {
      console.error('Error updating session with payment:', error);
      Alert.alert('Error', 'Failed to update session payment');
    } finally {
      setIsPaymentLoading(false);
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
      
      setIsExporting(true);
      
      // Determine export name based on current filters
      let exportName = "All Patients";
      
      if (currentFilters && currentFilters.patientId) {
        // Find patient name from the patient ID
        const patient = patients.find(p => p.id === currentFilters.patientId);
        if (patient) {
          exportName = patient.name;
        }
      } else if (patientId) {
        // Use patient from route params
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
          exportName = patient.name;
        }
      }
      
      await exportSessionsToExcel(displaySessions, exportName);
      // if (success) {
      //   Alert.alert('Success', 'Sessions exported successfully');
      // } else {
      //   Alert.alert('Error', 'Failed to export sessions');
      // }
    } catch (error) {
      console.error('Error exporting sessions:', error);
      Alert.alert('Error', 'Failed to export sessions');
    } finally {
      setIsExporting(false);
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
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <FileDown size={20} color="white" />
            )}
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
        resetOnOpen={false} // Don't reset values when reopening modal
      />

      {/* Data Status Bar */}
      <View style={styles.statusBarContainer}>
        <DataStatusBar 
          onRefresh={refreshSessions}
          dataType="sessions"
        />
      </View>

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
          <Text style={[styles.noSessionsText, { color: theme.textColor }]}>No past sessions found</Text>
        </View>
      ) : (
        <FlatList
          data={displaySessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // Allow editing for unmarked sessions and cancelled sessions (not completed)
            const allowEdit = !item.completed;
            
            return (
              <SessionCard
                session={item}
                onEdit={allowEdit ? (session) => handleEditSession(session) : () => Alert.alert('Info', 'Cannot edit completed sessions')}
                onDelete={(sessionId) => handleDeleteSession(sessionId)} 
                onToggleComplete={(session, completed) => {
                  // Only allow marking incomplete sessions as complete
                  if (session.completed && !completed) {
                    Alert.alert('Info', 'Completed sessions cannot be marked as incomplete. You can delete the session if needed.');
                  } else if (!session.completed && completed) {
                    handleToggleComplete(session, completed);
                  }
                }}
                allowEdit={allowEdit} // Hide edit button for completed sessions only
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
          isLoading={isPaymentLoading}
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
  statusBarContainer: {
    marginBottom: 10,
  },
});