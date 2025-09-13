import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Modal, 
  useColorScheme,
  ScrollView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveMultipleSessions, updateSession, getCurrentUserPatients, updateAllPatientSessionsDetails, getLastActiveSessionDate } from '../utils/mongoStorage';
import { Session, Patient } from '../types';
import { scheduleSessionNotification } from '../utils/notifications';

interface SessionFormProps {
  existingSession?: Session;
  preselectedPatientId?: string;
  onSave: (session: Session) => void;
  onCancel: () => void;
  showUpdateAll?: boolean;
}

export default function SessionForm({ existingSession, preselectedPatientId, onSave, onCancel, showUpdateAll = true }: SessionFormProps) {
  // Get the device color scheme
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Create theme object based on the color scheme
  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : 'white',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    borderColor: isDarkMode ? '#444444' : '#DDDDDD',
    inputBackground: isDarkMode ? '#2A2A2A' : 'white',
    primaryColor: '#0A84FF',
    errorColor: '#FF453A',
    cancelButtonBg: isDarkMode ? '#444444' : '#E5E5EA',
    modalBg: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    separatorColor: isDarkMode ? '#333333' : '#EFEFEF',
    placeholderColor: isDarkMode ? '#888888' : '#999999',
  };

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(existingSession?.patientId || preselectedPatientId || '');
  const [sessionCount, setSessionCount] = useState('1');
  const [time, setTime] = useState(existingSession ? new Date(`2000-01-01T${existingSession.time}`) : new Date());
  const [notes, setNotes] = useState(existingSession?.notes || '');
  const [amount, setAmount] = useState(existingSession?.amount !== undefined && existingSession?.amount !== null ? existingSession.amount.toString() : '');
  const [cancelled, setCancelled] = useState(existingSession?.cancelled || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [originalAmount, _setOriginalAmount] = useState(existingSession?.amount !== undefined && existingSession?.amount !== null ? existingSession.amount.toString() : '');
  const [originalNotes, _setOriginalNotes] = useState(existingSession?.notes || '');
  const [originalTime, _setOriginalTime] = useState(existingSession ? new Date(`2000-01-01T${existingSession.time}`) : new Date());
  const [errors, setErrors] = useState<{ patientId?: string; sessionCount?: string; time?: string; amount?: string }>({});
  
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Check if any field has been changed from original value
  const isAnyFieldChanged = () => {
    const amountChanged = amount !== originalAmount;
    const notesChanged = notes !== originalNotes;
    const timeChanged = time.getTime() !== originalTime.getTime();
    
    return amountChanged || notesChanged || timeChanged;
  };

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const patientsList = await getCurrentUserPatients();
        setPatients(patientsList);
        
        // If there's only one patient and no patient is selected, select it automatically
        if (patientsList.length === 1 && !patientId) {
          setPatientId(patientsList[0].id);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };
    
    loadPatients();
  }, [patientId]);

  const validateForm = (): boolean => {
    const newErrors: { patientId?: string; sessionCount?: string; time?: string; amount?: string } = {};
    
    if (!patientId) {
      newErrors.patientId = 'Please select a patient';
    }
    
    // Only validate session count for new sessions
    if (!existingSession) {
      const count = parseInt(sessionCount, 10);
      if (!sessionCount || isNaN(count) || count < 1 || count > 365) {
        newErrors.sessionCount = 'Please enter a valid session count (1-365)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showSessionCreationConfirmation = async (): Promise<boolean> => {
    if (existingSession || !patientId) {
      return true; // Skip confirmation for existing sessions or when no patient is selected
    }

    try {
      const lastActiveDate = await getLastActiveSessionDate(patientId);
      const patient = patients.find(p => p.id === patientId);
      const patientName = patient?.name || 'this patient';
      const count = parseInt(sessionCount, 10);
      
      if (lastActiveDate) {
        const lastActiveDateObj = new Date(lastActiveDate);
        const startDate = new Date(lastActiveDateObj);
        startDate.setDate(lastActiveDateObj.getDate() + 1); // Start from day after last active session
        
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + count - 1); // Calculate end date
        
        
        return new Promise((resolve) => {
          Alert.alert(
            'Confirm Session Creation',
            `${patientName} has active sessions. ${count} new session(s) will be created after the last active session, starting from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}. Continue?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Create Sessions', onPress: () => resolve(true) }
            ]
          );
        });
      } else {
        // No active sessions, start from today
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + count - 1);
        
        return new Promise((resolve) => {
          Alert.alert(
            'Confirm Session Creation',
            `${count} new session(s) will be created starting from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}. Continue?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Create Sessions', onPress: () => resolve(true) }
            ]
          );
        });
      }
    } catch (error) {
      console.error('Error showing confirmation:', error);
      return true; // Allow creation if confirmation fails
    }
  };

  const formatTimeForDisplay = (timeDate: Date): string => {
    return timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeForStorage = (timeDate: Date): string => {
    return timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDateForStorage = (dateObj: Date): string => {
    // Create a new date object to avoid timezone issues
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      setTime(selectedTime);
    }
  };


  const getPatientNameById = (id: string): string => {
    const patient = patients.find(p => p.id === id);
    return patient ? patient.name : '';
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    // Show confirmation for new sessions
    if (!existingSession) {
      const shouldCreate = await showSessionCreationConfirmation();
      if (!shouldCreate) {
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      
      const patientName = getPatientNameById(patientId);
      const formattedTime = formatTimeForStorage(time);
      const count = parseInt(sessionCount, 10);
      
      if (existingSession) {
        // For editing existing session, we still use the original date
        const formattedDate = formatDateForStorage(new Date(existingSession.date));
        const updatedSessionData: Session = {
          ...existingSession,
          patientId,
          patientName,
          date: formattedDate,
          time: formattedTime,
          notes,
          cancelled,
        };
        
        // Add amount if provided, or set to 0 if cancelled
        if (cancelled) {
          updatedSessionData.amount = 0;
        } else if (amount.trim()) {
          updatedSessionData.amount = parseFloat(amount);
        } else {
          updatedSessionData.amount = undefined;
        }
        
        await updateSession(updatedSessionData);
        
        // Schedule notification for the updated session
        await scheduleSessionNotification(updatedSessionData);
        
        onSave(updatedSessionData);
      } else {
        // Create multiple sessions starting from calculated start date
        const sessions = [];
        
        // Calculate start date based on patient's last active session
        let startDate = new Date();
        try {
          const lastActiveDate = await getLastActiveSessionDate(patientId);
          if (lastActiveDate) {
            const lastActiveDateObj = new Date(lastActiveDate);
            startDate = new Date(lastActiveDateObj);
            startDate.setDate(lastActiveDateObj.getDate() + 1); // Start from day after last active session
          }
        } catch (error) {
          console.error('Error getting last active date, using today:', error);
          // Use today as fallback
        }
        
        for (let i = 0; i < count; i++) {
          const sessionDate = new Date(startDate);
          sessionDate.setDate(startDate.getDate() + i);
          const formattedDate = formatDateForStorage(sessionDate);
          
          const sessionData: Omit<Session, 'id' | 'createdAt' | 'userId'> = {
            patientId,
            patientName,
            date: formattedDate,
            time: formattedTime,
            notes,
            completed: false,
            cancelled,
          };
          
          // Add amount if provided, or set to 0 if cancelled
          if (cancelled) {
            sessionData.amount = 0;
          } else if (amount.trim()) {
            sessionData.amount = parseFloat(amount);
          }
          
          sessions.push(sessionData);
        }
        
        // Save all sessions
        const createdSessions = await saveMultipleSessions(sessions);
        
        // Schedule notifications for all new sessions
        for (const session of createdSessions) {
          await scheduleSessionNotification(session);
        }
        
        // Call onSave with the first session (for compatibility with existing code)
        onSave(createdSessions[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save session information');
      console.error('Error saving session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAll = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!existingSession) {
      Alert.alert('Error', 'Update All is only available when editing existing sessions');
      return;
    }

    const patientName = getPatientNameById(patientId);
    const formattedTime = formatTimeForStorage(time);
    
    Alert.alert(
      'Update All Sessions',
      `This will update the notes, time, and amount in ALL sessions for ${patientName}. Are you sure you want to continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdatingAll(true);
              
              // Update the current session first
              const updatedSessionData: Session = {
                ...existingSession,
                patientId,
                patientName,
                date: formatDateForStorage(new Date(existingSession.date)),
                time: formattedTime,
                notes,
                cancelled,
              };
              
              // Add amount if provided, or set to 0 if cancelled
              if (cancelled) {
                updatedSessionData.amount = 0;
              } else if (amount.trim()) {
                updatedSessionData.amount = parseFloat(amount);
              } else {
                updatedSessionData.amount = undefined;
              }
              
              await updateSession(updatedSessionData);
              
              // Update all other sessions for this patient
              const sessionDetails: { notes?: string; time?: string; amount?: number } = {
                notes: notes.trim(),
                time: formattedTime
              };
              
              // Add amount if provided, or set to 0 if cancelled
              if (cancelled) {
                sessionDetails.amount = 0;
              } else if (amount.trim()) {
                sessionDetails.amount = parseFloat(amount);
              }
              
              await updateAllPatientSessionsDetails(patientId, sessionDetails);
              
              Alert.alert('Success', 'Current session and all other sessions for this patient have been updated successfully!');
              onSave(updatedSessionData);
            } catch (error) {
              Alert.alert('Error', 'Failed to update sessions');
              console.error('Error updating all sessions:', error);
            } finally {
              setIsUpdatingAll(false);
            }
          }
        }
      ]
    );
  };

  // Render the time picker based on platform
  const renderTimePicker = () => {
    if (Platform.OS === 'ios') {
      // iOS uses modal approach for time picker
      return (
        <>
          {showTimePicker && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showTimePicker}
            >
              <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
                <View style={[styles.datePickerContainer, { backgroundColor: theme.backgroundColor }]}>
                  <View style={[styles.datePickerHeader, { borderBottomColor: theme.separatorColor }]}>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={[styles.datePickerCancelText, { color: theme.errorColor }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={[styles.datePickerDoneText, { color: theme.primaryColor }]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    style={styles.datePicker}
                    textColor={theme.textColor}
                    themeVariant={isDarkMode ? 'dark' : 'light'}
                  />
                </View>
              </View>
            </Modal>
          )}
        </>
      );
    } else {
      // Android uses the default dialog but needs theme variant
      return (
        <>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={handleTimeChange}
              themeVariant={isDarkMode ? 'dark' : 'light'}
            />
          )}
        </>
      );
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.title, { color: theme.textColor }]}>
        {existingSession ? 'Edit Session' : 'Add New Sessions'}
      </Text>
      
      {/* Patient Selector */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textColor }]}>Patient</Text>
        {patients.length > 0 ? (
          existingSession ? (
            // For existing sessions, show patient name as clickable but don't allow editing
            <TouchableOpacity 
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.borderColor,
                  opacity: 0.7
                }
              ]}
              onPress={() => {
                // Could navigate to patient details or show patient info
                Alert.alert('Patient Info', `Patient: ${getPatientNameById(patientId)}`);
              }}
            >
              <Text style={{ color: theme.textColor }}>
                {patientId ? getPatientNameById(patientId) : 'No patient selected'}
              </Text>
            </TouchableOpacity>
          ) : (
            // For new sessions, allow patient selection
            <TouchableOpacity 
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.inputBackground,
                  borderColor: errors.patientId ? theme.errorColor : theme.borderColor 
                }
              ]}
              onPress={() => setShowPatientPicker(true)}
            >
              <Text style={{ color: theme.textColor }}>
                {patientId ? getPatientNameById(patientId) : 'Select a patient'}
              </Text>
            </TouchableOpacity>
          )
        ) : (
          <Text style={[styles.noDataText, { color: theme.errorColor }]}>
            No patients available. Please add a patient first.
          </Text>
        )}
        {errors.patientId ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.patientId}</Text> : null}
      </View>
      
      {/* Session Count Input - Only show for new sessions */}
      {!existingSession && (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.textColor }]}>Number of Sessions</Text>
          <Text style={[styles.helpText, { color: theme.placeholderColor }]}>
            Sessions will be created starting after the patient's last active session (or from today if no active sessions)
          </Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: theme.inputBackground,
                borderColor: errors.sessionCount ? theme.errorColor : theme.borderColor,
                color: theme.textColor
              }
            ]}
            value={sessionCount}
            onChangeText={setSessionCount}
            placeholder="Enter number of sessions (1-365)"
            placeholderTextColor={theme.placeholderColor}
            keyboardType="numeric"
            maxLength={3}
          />
          {errors.sessionCount ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.sessionCount}</Text> : null}
        </View>
      )}


      
      {/* Time Selector */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textColor }]}>Time</Text>
        <TouchableOpacity 
          style={[styles.dateTimeButton, { backgroundColor: theme.inputBackground, borderColor: theme.borderColor }]}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={{ color: theme.textColor }}>{formatTimeForDisplay(time)}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Notes Input */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textColor }]}>Notes</Text>
        <TextInput
          style={[
            styles.textArea, 
            { 
              backgroundColor: theme.inputBackground,
              borderColor: theme.borderColor,
              color: theme.textColor
            }
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add session notes (optional)"
          placeholderTextColor={theme.placeholderColor}
          multiline={true}
          numberOfLines={4}
        />
      </View>
      
      {/* Amount Input */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textColor }]}>Amount ($)</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              backgroundColor: theme.inputBackground,
              borderColor: errors.amount ? theme.errorColor : theme.borderColor,
              color: theme.textColor
            }
          ]}
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount (optional)"
          placeholderTextColor={theme.placeholderColor}
          keyboardType="decimal-pad"
        />
        {errors.amount ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.amount}</Text> : null}
      </View>
      
      {/* Cancelled Checkbox - Only show when editing existing session */}
      {existingSession && (
        <View style={styles.formGroup}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => {
              setCancelled(!cancelled);
              if (!cancelled) {
                setAmount('0');
              }
            }}
          >
            <View style={[
              styles.checkbox,
              { 
                backgroundColor: cancelled ? theme.primaryColor : 'transparent',
                borderColor: theme.borderColor
              }
            ]}>
              {cancelled && <Text style={[styles.checkmark, { color: 'white' }]}>✓</Text>}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.textColor }]}>
              Mark as Cancelled
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button, 
            { backgroundColor: theme.cancelButtonBg },
            (isSubmitting || isUpdatingAll) ? styles.disabledButton : null
          ]}
          onPress={onCancel}
          disabled={isSubmitting || isUpdatingAll}
        >
          <Text style={[styles.cancelButtonText, { color: theme.textColor }]}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button, 
            { backgroundColor: theme.primaryColor },
            (isSubmitting || isUpdatingAll) ? styles.disabledButton : null
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || isUpdatingAll || patients.length === 0}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting ? 'Saving...' : existingSession ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Update All button - only show when editing existing session AND fields have been changed AND showUpdateAll is true AND not cancelled */}
      {existingSession && isAnyFieldChanged() && showUpdateAll && !cancelled && (
        <View style={styles.updateAllContainer}>
          <TouchableOpacity
            style={[
              styles.updateAllButton, 
              { backgroundColor: '#FF9500' }, 
              isUpdatingAll ? styles.disabledButton : null
            ]}
            onPress={handleUpdateAll}
            disabled={isSubmitting || isUpdatingAll}
          >
            <Text style={[styles.updateAllButtonText, { color: 'white' }]}>
              {isUpdatingAll ? 'Updating All...' : 'Update All Sessions'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Patient Picker Modal */}
      <Modal
        visible={showPatientPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPatientPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Select Patient</Text>
            {/* FlatList is removed, using ScrollView for now */}
            <ScrollView>
              {patients.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  style={[styles.patientItem, { borderBottomColor: theme.separatorColor }]}
                  onPress={() => {
                    setPatientId(patient.id);
                    setShowPatientPicker(false);
                  }}
                >
                  <Text style={[
                    styles.patientName,
                    { color: theme.textColor },
                    patientId === patient.id ? { color: theme.primaryColor, fontWeight: 'bold' } : null
                  ]}>
                    {patient.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.cancelButtonBg }]}
              onPress={() => setShowPatientPicker(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textColor }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Time Picker */}
      {renderTimePicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateDisplay: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 5,
  },
  noDataText: {
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  patientItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  patientName: {
    fontSize: 16,
  },
  datePickerContainer: {
    borderRadius: 10,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
  },
  datePickerCancelText: {
    fontSize: 16,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePicker: {
    height: 200,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    flex: 1,
  },
  updateAllContainer: {
    marginTop: 15,
  },
  updateAllButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  updateAllButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});