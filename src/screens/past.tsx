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

// Constants
const MAX_DATE_RANGE_DAYS = 90;
const FLATLIST_ITEM_HEIGHT = 120;

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
  const [filterKey, setFilterKey] = useState(0); // Key to force filter reset

  // Use global state instead of local state
  const { 
    pastSessions, 
    patients,
    sessionsLoading, 
    sessionsError,
    sessionsRefreshFailed,
    dispatch 
  } = useAppState();
  
  // Get user data for clinic filtering
  const { user } = require('../../utils/AuthContext').useAuth();
  
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
    primaryColor: isDarkMode ? '#0A84FF' : '#00143f',
    errorColor: '#FF453A',
    placeholderColor: isDarkMode ? '#888888' : '#999999',
    modalBg: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    separatorColor: isDarkMode ? '#333333' : '#EFEFEF',
  };

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDateString = (): string => {
    const today = new Date();
    return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  };

  // Helper function to get the cached date range (90 days back from yesterday)
  const getCachedDateRange = useCallback(() => {
    const todayObj = new Date(getTodayDateString() + 'T12:00:00');
    const ninetyDaysAgo = new Date(todayObj);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - MAX_DATE_RANGE_DAYS);
    const yesterday = new Date(todayObj);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return {
      start: ninetyDaysAgo.toISOString().split('T')[0],
      end: yesterday.toISOString().split('T')[0]
    };
  }, []);

  // Helper function to validate date range
  const validateDateRange = (startDate: string, endDate: string): { isValid: boolean; adjustedEndDate?: string } => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > MAX_DATE_RANGE_DAYS) {
      const adjustedEnd = new Date(start);
      adjustedEnd.setDate(adjustedEnd.getDate() + MAX_DATE_RANGE_DAYS);
      return { isValid: false, adjustedEndDate: adjustedEnd.toISOString().split('T')[0] };
    }
    
    return { isValid: true };
  };

  // Helper function to check if dates are within cached range
  const isWithinCachedRange = (startDate: string, endDate: string): boolean => {
    const { start: cachedStart, end: cachedEnd } = getCachedDateRange();
    return startDate >= cachedStart && startDate <= cachedEnd && 
           endDate >= cachedStart && endDate <= cachedEnd;
  };

  // Local filtering function - no API calls needed!
  const filterSessionsLocally = useCallback((sessions: Session[], filters: any) => {
    let filtered = [...sessions];

    // Filter by patient ID
    if (filters.patientId) {
      filtered = filtered.filter(session => session.patientId === filters.patientId);
    }

    // Filter by clinic ID (filter sessions created by a specific clinic)
    if (filters.clinicId) {
      filtered = filtered.filter(session => session.userId === filters.clinicId);
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

  // Consolidated filter application logic
  const applyFilters = useCallback((filters?: any) => {
    try {
      setCurrentFilters(filters);
      
      if (filters || patientId) {
        const filterToApply = filters || { patientId };
        setIsFiltered(true);
        const filteredSessionsData = filterSessionsLocally(pastSessions, filterToApply);
        setFilteredSessions(filteredSessionsData);
      } else {
        setIsFiltered(false);
        setFilteredSessions([]);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [patientId, pastSessions, filterSessionsLocally]);

  // Helper function to refresh data and reapply filters
  const refreshDataAndReapplyFilters = useCallback(() => {
    dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
    if (isFiltered && currentFilters) {
      applyFilters(currentFilters);
    }
  }, [dispatch, isFiltered, currentFilters, applyFilters]);

  // Helper function to get export name based on current filters
  const getExportName = useCallback((): string => {
    if (currentFilters?.clinicId) {
      const clinic = user?.clinics?.find((c: { clinicId: string; clinicName: string }) => c.clinicId === currentFilters.clinicId);
      return clinic?.clinicName || 'Unknown Clinic';
    }
    if (currentFilters?.patientId) {
      const patient = patients.find(p => p.id === currentFilters.patientId);
      return patient?.name || 'Unknown Patient';
    }
    if (patientId) {
      const patient = patients.find(p => p.id === patientId);
      return patient?.name || 'Unknown Patient';
    }
    return 'All Patients';
  }, [currentFilters, patientId, patients, user?.clinics]);

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
        
        // Check if the range is within our cached data
        if (isWithinCachedRange(filters.startDate, filters.endDate)) {
          // Use local store data
          applyFilters(filters);
        } else {
          // Fetch from server with the specified date range
          const userDate = getTodayDateString();
          
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
    setFilterKey(prev => prev + 1); // Force filter form reset
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
              refreshDataAndReapplyFilters();
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
      refreshDataAndReapplyFilters();
      
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

  // Memoized render function for better performance
  const renderSessionItem = useCallback(({ item }: { item: Session }) => {
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
  }, [handleEditSession, handleDeleteSession, handleToggleComplete]);

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setSessionModalVisible(true);
  };

  const handleSaveSession = async (_session: Session) => {
    setSessionModalVisible(false);
    setSelectedSession(undefined);
    refreshDataAndReapplyFilters();
  };

  // Apply filters when component mounts or patientId changes
  useEffect(() => {
    // Reapply stored filters when data changes (e.g., after refresh)
    if (isFiltered && currentFilters) {
      applyFilters(currentFilters);
    } else if (patientId) {
      // Apply patient filter from route params
      applyFilters();
    }
  }, [pastSessions, applyFilters, isFiltered, currentFilters, patientId]);

  const handleExportSessions = async () => {
    try {
      if (displaySessions.length === 0) {
        Alert.alert('No Data', 'There are no past sessions to export');
        return;
      }
      
      setIsExporting(true);
      const exportName = getExportName();
      await exportSessionsToExcel(displaySessions, exportName);
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
          
          <View style={styles.filterButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                { 
                  backgroundColor: isFiltered ? theme.primaryColor : theme.borderColor,
                }
              ]}
              onPress={() => setShowFilter(!showFilter)}
            >
              <Filter size={20} color={isFiltered ? 'white' : theme.textColor} />
            </TouchableOpacity>
            {isFiltered && (
              <TouchableOpacity
                style={styles.clearFilterIcon}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent opening filter modal
                  handleClearFilter();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearFilterIconText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
          
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
        key={filterKey} // Force reset when key changes
        patients={patients}
        user={user}
        onApplyFilter={handleApplyFilter}
        onClearFilter={handleClearFilter}
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        showCancelledOption={true}
        resetOnOpen={true} // Reset values when modal opens
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
          renderItem={renderSessionItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: FLATLIST_ITEM_HEIGHT,
            offset: FLATLIST_ITEM_HEIGHT * index,
            index,
          })}
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
  filterButtonContainer: {
    position: 'relative',
    marginRight: 10,
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
  },
  clearFilterIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  clearFilterIconText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
    textAlign: 'center',
    includeFontPadding: false,
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