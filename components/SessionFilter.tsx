import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
  useColorScheme,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Patient, SessionFilter, User } from '../types';

interface SessionFilterProps {
  patients: Patient[];
  user?: Omit<User, 'password'> | null;
  onApplyFilter: (filter: SessionFilter) => void;
  onClearFilter: () => void;
  visible?: boolean;
  onClose?: () => void;
  showCancelledOption?: boolean;
  resetOnOpen?: boolean; // Whether to reset values when modal opens
}

export default function SessionFilterComponent({ patients, user, onApplyFilter, onClearFilter, visible = false, onClose, showCancelledOption = true, resetOnOpen = true }: SessionFilterProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Theme-based styles
  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : 'white',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    borderColor: isDarkMode ? '#444444' : '#DDDDDD',
    inputBackground: isDarkMode ? '#2A2A2A' : 'white',
    primaryColor: isDarkMode ? '#0A84FF' : '#00143f',
    errorColor: '#FF453A',
    modalBg: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    separatorColor: isDarkMode ? '#333333' : '#EFEFEF',
  };

  const [patientId, setPatientId] = useState<string>('');
  const [clinicId, setClinicId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showPatientPicker, setShowPatientPicker] = useState(false); // Add state for patient picker modal
  const [includeCancelled, setIncludeCancelled] = useState(false);

  // Reset dates when modal becomes visible (only if resetOnOpen is true)
  useEffect(() => {
    if (visible && resetOnOpen) {
      setStartDate(new Date());
      setEndDate(new Date());
      setPatientId('');
      setClinicId('');
      setIncludeCancelled(false);
    }
  }, [visible, resetOnOpen]);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Ensure end date is within valid range when opening picker
  const handleEndDatePickerOpen = () => {
    const maxEndDate = getMaxEndDate(startDate);
    if (endDate > maxEndDate) {
      setEndDate(maxEndDate);
    }
    setShowEndDatePicker(true);
  };

  // Ensure start date is valid when opening picker
  const handleStartDatePickerOpen = () => {
    // If end date is set, ensure start date is not more than 90 days before end date
    if (endDate) {
      const minStartDate = new Date(endDate);
      minStartDate.setDate(minStartDate.getDate() - 90);
      
      if (startDate < minStartDate) {
        setStartDate(minStartDate);
      }
    }
    setShowStartDatePicker(true);
  };

  const formatDateForDisplay = (dateObj: Date): string => {
    return dateObj.toLocaleDateString();
  };

  // Helper function to get the maximum allowed end date (90 days from start date)
  const getMaxEndDate = (startDateParam: Date): Date => {
    const maxEndDate = new Date(startDateParam);
    maxEndDate.setDate(maxEndDate.getDate() + 90);
    return maxEndDate;
  };

  // Helper function to get the minimum allowed start date (90 days before end date)
  const getMinStartDate = (endDateParam: Date): Date => {
    const minStartDate = new Date(endDateParam);
    minStartDate.setDate(minStartDate.getDate() - 90);
    return minStartDate;
  };

  // Helper function to format date for storage without timezone issues
  const formatDateForStorage = (dateObj: Date): string => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const applyFilter = () => {
    const filter: SessionFilter = {};
    
    if (patientId) {
      filter.patientId = patientId;
    }
    
    if (clinicId) {
      filter.clinicId = clinicId;
    }
    
    filter.startDate = formatDateForStorage(startDate);
    filter.endDate = formatDateForStorage(endDate);
    
    // Only include cancelled option if it's available
    if (showCancelledOption) {
      filter.includeCancelled = includeCancelled;
    }
    
    onApplyFilter(filter);
    onClose && onClose();
  };

  const clearFilter = () => {
    setPatientId('');
    setClinicId('');
    setStartDate(new Date());
    setEndDate(new Date());
    setIncludeCancelled(false);
    onClose && onClose();
    onClearFilter();
  };

  const getPatientNameById = (id: string): string => {
    const patient = patients.find(p => p.id === id);
    return patient ? patient.name : '';
  };

  const getClinicNameById = (id: string): string => {
    const clinic = user?.clinics?.find(c => c.clinicId === id);
    return clinic ? clinic.clinicName : '';
  };

  const getFilterDisplayName = (): string => {
    if (clinicId) {
      return `Clinic: ${getClinicNameById(clinicId)}`;
    } else if (patientId) {
      return getPatientNameById(patientId);
    }
    return 'Select patient or clinic';
  };

  // Create a combined list of patients and clinics for the picker
  const filterOptions = [
    ...patients.map(p => ({ id: p.id, name: p.name, type: 'patient' as const })),
    ...(user?.clinics || []).map(c => ({ id: c.clinicId, name: `Clinic: ${c.clinicName}`, type: 'clinic' as const }))
  ];

  const renderDateTimePicker = (mode: 'start' | 'end') => {
    const isStart = mode === 'start';
    const value = isStart ? startDate : endDate;
    const onChange = isStart ? handleStartDateChange : handleEndDateChange;
    const showPicker = isStart ? showStartDatePicker : showEndDatePicker;

    if (Platform.OS === 'ios') {
      return (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showPicker}
          onRequestClose={() => (isStart ? setShowStartDatePicker(false) : setShowEndDatePicker(false))}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
            <View style={[styles.datePickerContainer, { backgroundColor: theme.backgroundColor }]}>
              <View style={[styles.datePickerHeader, { borderBottomColor: theme.separatorColor }]}>
                <TouchableOpacity onPress={() => (isStart ? setShowStartDatePicker(false) : setShowEndDatePicker(false))}>
                  <Text style={[styles.datePickerCancelText, { color: theme.errorColor }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => (isStart ? setShowStartDatePicker(false) : setShowEndDatePicker(false))}>
                  <Text style={[styles.datePickerDoneText, { color: theme.primaryColor }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value}
                mode="date"
                display="spinner"
                onChange={onChange}
                minimumDate={isStart ? (endDate ? getMinStartDate(endDate) : undefined) : startDate}
                maximumDate={isStart ? undefined : getMaxEndDate(startDate)}
                textColor={theme.textColor}
                themeVariant={isDarkMode ? 'dark' : 'light'}
              />
            </View>
          </View>
        </Modal>
      );
    } else {
      return (
        showPicker && (
          <DateTimePicker
            value={value}
            mode="date"
            display="default"
            onChange={onChange}
            minimumDate={isStart ? (endDate ? getMinStartDate(endDate) : undefined) : startDate}
            maximumDate={isStart ? undefined : getMaxEndDate(startDate)}
            themeVariant={isDarkMode ? 'dark' : 'light'}
          />
        )
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {visible && (
        <View style={[styles.filterOptions, { backgroundColor: theme.backgroundColor }]}>
          {/* Patient/Clinic Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.textColor }]}>Filter by Patient or Clinic</Text>
            {filterOptions.length > 0 ? (
              <TouchableOpacity 
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.borderColor,
                  }
                ]}
                onPress={() => setShowPatientPicker(true)}
              >
                <Text style={{ color: theme.textColor }}>
                  {getFilterDisplayName()}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.noDataText, { color: theme.errorColor }]}>
                No patients or clinics available.
              </Text>
            )}
          </View>
          
          {/* Start Date Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.textColor }]}>Start Date</Text>
            <TouchableOpacity 
              style={[styles.dateTimeButton, { backgroundColor: theme.inputBackground, borderColor: theme.borderColor }]}
              onPress={handleStartDatePickerOpen}
            >
              <Text style={{ color: theme.textColor }}>{formatDateForDisplay(startDate)}</Text>
            </TouchableOpacity>
            {renderDateTimePicker('start')}
          </View>
          
          {/* End Date Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.textColor }]}>End Date</Text>
            <TouchableOpacity 
              style={[styles.dateTimeButton, { backgroundColor: theme.inputBackground, borderColor: theme.borderColor }]}
              onPress={handleEndDatePickerOpen}
            >
              <Text style={{ color: theme.textColor }}>{formatDateForDisplay(endDate)}</Text>
            </TouchableOpacity>
            {renderDateTimePicker('end')}
            
            {/* 90-day limit info */}
            <Text style={[styles.dateRangeInfo, { color: theme.textColor, opacity: 0.7 }]}>
              Maximum 90 days from start date
            </Text>
          </View>
          
          {/* Include Cancelled Sessions Checkbox - Only show if showCancelledOption is true */}
          {showCancelledOption && (
            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setIncludeCancelled(!includeCancelled)}
              >
                <View style={[
                  styles.checkbox,
                  { 
                    backgroundColor: includeCancelled ? theme.primaryColor : 'transparent',
                    borderColor: theme.borderColor
                  }
                ]}>
                  {includeCancelled && <Text style={[styles.checkmark, { color: 'white' }]}>✓</Text>}
                </View>
                <Text style={[styles.checkboxLabel, { color: theme.textColor }]}>
                  Include Cancelled Sessions
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.clearButton, { backgroundColor: theme.separatorColor }]}
              onPress={clearFilter}
            >
              <Text style={[styles.clearButtonText, { color: theme.textColor }]}>Clear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.applyButton, { backgroundColor: theme.primaryColor }]}
              onPress={applyFilter}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Patient/Clinic Picker Modal */}
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
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Select Patient or Clinic</Text>
            <FlatList
              data={filterOptions}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              renderItem={({ item }) => {
                const isSelected = item.type === 'patient' ? patientId === item.id : clinicId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.patientItem, { borderBottomColor: theme.separatorColor }]}
                    onPress={() => {
                      if (item.type === 'patient') {
                        setPatientId(item.id);
                        setClinicId(''); // Clear clinic selection
                      } else {
                        setClinicId(item.id);
                        setPatientId(''); // Clear patient selection
                      }
                      setShowPatientPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.patientName,
                      { color: theme.textColor },
                      isSelected ? { color: theme.primaryColor, fontWeight: 'bold' } : null
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  filterOptions: {
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateTimeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  noDataText: {
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  clearButton: {},
  applyButton: {},
  clearButtonText: {
    fontWeight: 'bold',
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  dateRangeInfo: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});