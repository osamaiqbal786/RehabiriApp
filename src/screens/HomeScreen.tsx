import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, useColorScheme, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Session } from '../../types';
import { updateSession, deleteSession } from '../../utils/mongoStorage';
import { useAppState } from '../hooks/useAppState';
import { useDataRefresh } from '../hooks/useDataRefresh';
import SessionCard from '../../components/SessionCard';
import SessionForm from '../../components/SessionForm';
import PaymentModal from '../../components/PaymentModal';
import DataStatusBar from '../components/DataStatusBar';
import StatusMessage from '../components/StatusMessage';

export default function TodayScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState<Session | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Use global state instead of local state
  const { 
    todaySessions, 
    sessionsLoading, 
    sessionsError,
    sessionsRefreshFailed,
    dispatch 
  } = useAppState();
  
  const { refreshSessions } = useDataRefresh();

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

  // No need for loadSessions - data is managed globally
  // useFocusEffect is also not needed as data is cached

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
      setSessionToComplete(session);
      setPaymentModalVisible(true);
    } else {
      try {
        const updatedSession = { ...session, completed, amount: undefined };
        await updateSession(updatedSession);
        // Trigger refresh of sessions data
        dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
      } catch (error) {
        console.error('Error updating session completion status:', error);
        Alert.alert('Error', 'Failed to update session status');
      }
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

  const handleSaveSession = async (_session: Session) => {
    setModalVisible(false);
    // Trigger refresh of sessions data
    dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
  };

  // Memoized render function for better performance
  const renderSessionItem = useCallback(({ item }: { item: Session }) => {
    // Allow editing for unmarked sessions and cancelled sessions (not completed)
    const allowEdit = !item.completed;
    
    return (
      <SessionCard
        session={item}
        onEdit={allowEdit ? handleEditSession : () => Alert.alert('Info', 'You need to unmark the session first to edit')}
        onDelete={handleDeleteSession}
        onToggleComplete={handleToggleComplete}
        allowEdit={true} // Always show edit button
        editDisabled={!allowEdit} // Disable when completed
      />
    );
  }, [handleEditSession, handleDeleteSession, handleToggleComplete]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.primaryColor }]}
          onPress={handleAddSession}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>


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
      ) : todaySessions.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={[styles.noSessionsText, { color: theme.textColor }]}>No sessions scheduled for today</Text>
          <TouchableOpacity 
            style={[styles.addSessionButton, { backgroundColor: theme.primaryColor }]}
            onPress={handleAddSession}
          >
            <Text style={styles.addSessionButtonText}>Add New Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={todaySessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderSessionItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 120, // Approximate height of each item
            offset: 120 * index,
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

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
            <View style={styles.modalContent}>
              <SessionForm
                existingSession={selectedSession}
                onSave={handleSaveSession}
                onCancel={() => setModalVisible(false)}
                showUpdateAll={false}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {sessionToComplete && (
        <PaymentModal
          visible={paymentModalVisible}
          session={sessionToComplete}
          onConfirm={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
          isLoading={isPaymentLoading}
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
  statusBarContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  loadingText: {
    marginTop: 10,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});
