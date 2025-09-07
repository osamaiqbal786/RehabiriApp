import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { Patient } from '../../types';
import { getCurrentUserPatients, deletePatient, getPatientsWithActiveSessions, closeAllUpcomingSessions } from '../../utils/mongoStorage';
import PatientForm from '../../components/PatientForm';
import PatientCard from '../../components/PatientCard';
import SessionForm from '../../components/SessionForm';

export default function PatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(undefined);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchQuery, _setSearchQuery] = useState('');
  const [patientsWithActiveSessions, setPatientsWithActiveSessions] = useState<Set<string>>(new Set());

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

  const checkActiveSessions = async (patientIds: string[]) => {
    try {
      // Use the new efficient endpoint to get all patients with active sessions
      const activePatientIds = await getPatientsWithActiveSessions(patientIds);
      const activePatients = new Set(activePatientIds);
      setPatientsWithActiveSessions(activePatients);
    } catch (error) {
      console.error('Error checking active sessions:', error);
    }
  };

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const patientsList = await getCurrentUserPatients();
      setPatients(patientsList);
      setFilteredPatients(patientsList);
      
      // Check for active sessions for all patients
      const patientIds = patientsList.map(patient => patient.id).filter(Boolean);
      await checkActiveSessions(patientIds);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients])
  );

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
              loadPatients();
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
              // Refresh patients and active sessions status
              await loadPatients();
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
    loadPatients();
  };

  const handleSaveSession = async () => {
    setSessionModalVisible(false);
    // Refresh patients and check for active sessions after creating a new session
    await loadPatients();
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

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={{ color: theme.textColor, marginTop: 10 }}>Loading patients...</Text>
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