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
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveMultipleSessions, updateSession, updateAllPatientSessionsDetails } from '../utils/mongoStorage';
import { Session } from '../types';
import { scheduleSessionNotification, cancelSessionNotification } from '../utils/notifications';
import { useAppState } from '../src/hooks/useAppState';
import MultiDateCalendar from './MultiDateCalendar';

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
  
  // Get all sessions from store
  const { todaySessions, upcomingSessions } = useAppState();

  // Get patient data from store instead of API call
  const { patients } = useAppState();

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

  const [patientId, setPatientId] = useState(existingSession?.patientId || preselectedPatientId || '');
  const [time, setTime] = useState(existingSession ? new Date(`2000-01-01T${existingSession.time}`) : new Date());
  const [notes, setNotes] = useState(existingSession?.notes || '');
  const [amount, setAmount] = useState(existingSession?.amount !== undefined && existingSession?.amount !== null ? existingSession.amount.toString() : '');
  const [cancelled, setCancelled] = useState(existingSession?.cancelled || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [originalAmount, _setOriginalAmount] = useState(existingSession?.amount !== undefined && existingSession?.amount !== null ? existingSession.amount.toString() : '');
  const [originalNotes, _setOriginalNotes] = useState(existingSession?.notes || '');
  const [originalTime, _setOriginalTime] = useState(existingSession ? new Date(`2000-01-01T${existingSession.time}`) : new Date());
  const [errors, setErrors] = useState<{ patientId?: string; selectedDates?: string; time?: string; amount?: string }>({});
  
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMultiDateCalendar, setShowMultiDateCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Check if any field has been changed from original value
  const isAnyFieldChanged = () => {
    const amountChanged = amount !== originalAmount;
    const notesChanged = notes !== originalNotes;
    const timeChanged = time.getTime() !== originalTime.getTime();
    
    return amountChanged || notesChanged || timeChanged;
  };

  useEffect(() => {
    // If there's only one patient and no patient is selected, select it automatically
    if (patients.length === 1 && !patientId) {
      setPatientId(patients[0].id);
    }
  }, [patients, patientId]);

  const validateForm = (): boolean => {
    const newErrors: { patientId?: string; selectedDates?: string; time?: string; amount?: string } = {};
    
    if (!patientId) {
      newErrors.patientId = 'Please select a patient';
    }
    
    // Only validate selected dates for new sessions
    if (!existingSession) {
      if (selectedDates.length === 0) {
        newErrors.selectedDates = 'Please select at least one date for the session(s)';
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
      const patient = patients.find(p => p.id === patientId);
      const patientName = patient?.name || 'this patient';
      const count = selectedDates.length;
      
      const dateList = selectedDates.map(date => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
      }).join(', ');
      
      return new Promise((resolve) => {
        Alert.alert(
          'Confirm Session Creation',
          `${count} new session(s) will be created for ${patientName} on: ${dateList}. Continue?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Create Sessions', onPress: () => resolve(true) }
          ]
        );
      });
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

  const handleDatesSelect = (dates: string[]) => {
    setSelectedDates(dates);
    // Don't close the calendar automatically - let user manually close it
  };

  const formatSelectedDates = (dates: string[]): string => {
    if (dates.length === 0) return 'No dates selected';
    if (dates.length === 1) {
      const date = new Date(dates[0]);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    return `${dates.length} dates selected`;
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
        
        // Cancel existing notification for this session
        try {
          await cancelSessionNotification(`session_${updatedSessionData.id}_*`);
          console.log('✅ Previous session notification cancelled for:', updatedSessionData.patientName);
        } catch (cancelError) {
          console.error('❌ Error cancelling previous session notification:', cancelError);
          // Don't throw error - continue with scheduling
        }
        
        // Schedule notification for the updated session
        await scheduleSessionNotification(updatedSessionData);
        
        onSave(updatedSessionData);
      } else {
        // Create sessions for selected dates
        const sessions = [];
        
        for (const dateString of selectedDates) {
          const sessionData: Omit<Session, 'id' | 'createdAt' | 'userId'> = {
            patientId,
            patientName,
            date: dateString, // Use the selected date directly
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
              
              // Get all sessions for this patient from store (before update)
              const allSessions = [...todaySessions, ...upcomingSessions];
              const patientSessions = allSessions.filter(session => session.patientId === patientId);
              console.log(`📋 Found ${patientSessions.length} sessions for patient: ${updatedSessionData.patientName}`);
              
              for (const session of patientSessions) {
                try {
                  await cancelSessionNotification(`session_${session.id}_*`);
                } catch (cancelError) {
                  console.error('❌ Error cancelling previous session notification:', cancelError);
                }
              }
              
              // Update sessions
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

              // Schedule notifications for all updated sessions
              const updatedPatientSessions = patientSessions.map(session => ({
                ...session,
                time: formattedTime,
              }));
              
              for (const session of updatedPatientSessions) {
                try {
                  await scheduleSessionNotification(session);
                } catch (notificationError) {
                  console.error('❌ Error scheduling session notification:', notificationError);
                }
              };
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
      
      {/* Date Selection - Only show for new sessions */}
      {!existingSession && (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.textColor }]}>Session Dates</Text>
          <Text style={[styles.helpText, { color: theme.placeholderColor }]}>
            Select the dates when you want to create sessions
          </Text>
          <TouchableOpacity 
            style={[
              styles.dateTimeButton, 
              { 
                backgroundColor: theme.inputBackground, 
                borderColor: errors.selectedDates ? theme.errorColor : theme.borderColor 
              }
            ]}
            onPress={() => setShowMultiDateCalendar(true)}
          >
            <Text style={{ color: selectedDates.length > 0 ? theme.textColor : theme.placeholderColor }}>
              {formatSelectedDates(selectedDates)}
            </Text>
          </TouchableOpacity>
          {errors.selectedDates && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.selectedDates}</Text>}
          {selectedDates.length > 0 && (
            <TouchableOpacity 
              style={styles.clearDatesButton}
              onPress={() => setSelectedDates([])}
            >
              <Text style={[styles.clearDatesText, { color: theme.primaryColor }]}>Clear all dates</Text>
            </TouchableOpacity>
          )}
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
        <TouchableOpacity
          style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}
          activeOpacity={1}
          onPress={() => setShowPatientPicker(false)}
        >
          <TouchableOpacity
            style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}
            activeOpacity={1}
            onPress={() => {}} // Prevent closing when clicking inside
          >
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      {/* Time Picker */}
      {renderTimePicker()}

      {/* Multi-Date Calendar Modal */}
      <MultiDateCalendar
        visible={showMultiDateCalendar}
        onClose={() => setShowMultiDateCalendar(false)}
        onDatesSelect={handleDatesSelect}
        selectedDates={selectedDates}
        title="Select Session Dates"
        theme={theme}
        isDarkMode={isDarkMode}
      />
      </View>
    </TouchableWithoutFeedback>
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
  clearDatesButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDatesText: {
    fontSize: 14,
    fontWeight: '500',
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