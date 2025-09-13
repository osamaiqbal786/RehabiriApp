import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { Patient } from '../../types';
import { deletePatient, getPatientsWithActiveSessions, closeAllUpcomingSessions } from '../../utils/mongoStorage';
import { useAppState } from '../hooks/useAppState';
import { useDataRefresh } from '../hooks/useDataRefresh';
import PatientForm from '../../components/PatientForm';
import PatientCard from '../../components/PatientCard';
import SessionForm from '../../components/SessionForm';
import DataStatusBar from '../components/DataStatusBar';

export default function PatientsScreen() {
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(undefined);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchQuery, _setSearchQuery] = useState('');
  const [patientsWithActiveSessions, setPatientsWithActiveSessions] = useState<Set<string>>(new Set());

  // Use global state instead of local state
  const { 
    patients, 
    patientsLoading, 
    patientsError,
    dispatch 
  } = useAppState();
  
  const { refreshPatients } = useDataRefresh();

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
  };

  const navigation = useNavigation();

  const checkActiveSessions = useCallback(async (patientIds: string[]) => {
    try {
      // Use the new efficient endpoint to get all patients with active sessions
      const activePatientIds = await getPatientsWithActiveSessions(patientIds);
      const activePatients = new Set(activePatientIds);
      setPatientsWithActiveSessions(activePatients);
    } catch (error) {
      console.error('Error checking active sessions:', error);
    }
  }, []);

  // Update filtered patients when global patients change
  useEffect(() => {
    setFilteredPatients(patients);
    // Check for active sessions for all patients
    const patientIds = patients.map(patient => patient.id).filter(Boolean);
    if (patientIds.length > 0) {
      checkActiveSessions(patientIds);
    }
  }, [patients, checkActiveSessions]);

  const handleAddPatient = () => {
    setSelectedPatient(undefined);
    setPatientModalVisible(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientModalVisible(true);
  };

  const handleDeletePatient = (patientId: string) => {
    Alert.alert(
      'Delete Patient',
      'Are you sure you want to delete this patient? All associated sessions will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePatient(patientId);
              // Trigger refresh of both patients and sessions data
              dispatch({ type: 'TRIGGER_PATIENTS_REFRESH' });
              dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
            } catch (error) {
              console.error('Error deleting patient:', error);
              Alert.alert('Error', 'Failed to delete patient');
            }
          }
        },
      ]
    );
  };

  const handleAddSession = (patientId: string) => {
    setSelectedPatientId(patientId);
    setSessionModalVisible(true);
  };

  const handleViewSessions = (patientId: string) => {
    // Get the patient name for display
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      Alert.alert('Error', 'Patient not found');
      return;
    }
    
    // Navigate to the patient sessions screen
    (navigation as any).navigate('PatientSessions', { patientId: patientId });
  };

  const handleCloseSessions = (patientId: string) => {
    // Get the patient name for display
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      Alert.alert('Error', 'Patient not found');
      return;
    }

    Alert.alert(
      'Close All Sessions',
      `This will mark ALL upcoming sessions for ${patient.name} as cancelled. Are you sure you want to continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Close Sessions', 
          style: 'destructive',
          onPress: async () => {
            try {
              await closeAllUpcomingSessions(patientId);
              Alert.alert('Success', 'All upcoming sessions have been marked as cancelled');
              // Trigger refresh of both patients and sessions data
              dispatch({ type: 'TRIGGER_PATIENTS_REFRESH' });
              dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
            } catch (error) {
              console.error('Error closing sessions:', error);
              Alert.alert('Error', 'Failed to close sessions');
            }
          }
        },
      ]
    );
  };

  const handleSavePatient = async (_patient: Patient) => {
    setPatientModalVisible(false);
    // Trigger refresh of patients data
    dispatch({ type: 'TRIGGER_PATIENTS_REFRESH' });
  };

  const handleSaveSession = async () => {
    setSessionModalVisible(false);
    // Trigger refresh of both patients and sessions data
    dispatch({ type: 'TRIGGER_PATIENTS_REFRESH' });
    dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.primaryColor }]}
          onPress={handleAddPatient}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Data Status Bar */}
      <DataStatusBar 
        onRefresh={refreshPatients}
        dataType="patients"
      />

      {patientsLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={[styles.loadingText, { color: theme.textColor }]}>Loading patients...</Text>
        </View>
      ) : patientsError ? (
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: theme.errorColor }]}>
            Error: {patientsError}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primaryColor }]}
            onPress={refreshPatients}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !filteredPatients || filteredPatients.length === 0 ? (
        <View style={styles.centerContent}>
          {searchQuery ? (
            <Text style={[styles.noResultsText, { color: theme.textColor }]}>No patients match your search</Text>
          ) : (
            <>
              <Text style={[styles.noPatientsText, { color: theme.textColor }]}>No patients added yet</Text>
              <TouchableOpacity 
                style={[styles.addPatientButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleAddPatient}
              >
                <Text style={styles.addPatientButtonText}>Add New Patient</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <FlatList
          style={styles.flatList}
          data={filteredPatients || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              onEdit={handleEditPatient}
              onDelete={handleDeletePatient}
              onAddSession={handleAddSession}
              onViewSessions={handleViewSessions}
              onCloseSessions={handleCloseSessions}
              hasActiveSessions={patientsWithActiveSessions.has(item.id || '')}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          scrollEnabled={true}
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={patientsLoading}
              onRefresh={refreshPatients}
              tintColor={theme.primaryColor}
            />
          }
        />
      )}

      {/* Patient Form Modal */}
      <Modal
        visible={patientModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPatientModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
            <PatientForm
              existingPatient={selectedPatient}
              onSave={handleSavePatient}
              onCancel={() => setPatientModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Session Form Modal */}
      <Modal
        visible={sessionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSessionModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
            <SessionForm
              preselectedPatientId={selectedPatientId}
              onSave={handleSaveSession}
              onCancel={() => setSessionModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
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
  noPatientsText: {
    fontSize: 16,
    marginBottom: 20,
  },
  noResultsText: {
    fontSize: 16,
    marginBottom: 20,
  },
  addPatientButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addPatientButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
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
    borderRadius: 10,
    padding: 20,
  },
});