import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, useColorScheme, Modal, FlatList, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { savePatient, updatePatient } from '../utils/mongoStorage';
import { Patient } from '../types';

interface PatientFormProps {
  existingPatient?: Patient;
  onSave: (patient: Patient) => void;
  onCancel: () => void;
}

export default function PatientForm({ existingPatient, onSave, onCancel }: PatientFormProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F2F2F7',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    inputBackground: isDarkMode ? '#333333' : 'white',
    borderColor: isDarkMode ? '#444444' : '#DDDDDD',
    buttonBackground: isDarkMode ? '#444444' : '#00143f',
    saveButtonBackground: isDarkMode ? '#0A84FF' : '#00143f',
    cancelButtonBackground: isDarkMode ? '#444444' : '#E5E5EA',
    buttonTextColor: 'white',
    errorColor: '#FF453A',
  };

  const [name, setName] = useState(existingPatient?.name || '');
  const [age, setAge] = useState(existingPatient?.age?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(existingPatient?.gender || '');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; age?: string; gender?: string }>({});

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  const handleGenderSelect = (selectedGender: string) => {
    setGender(selectedGender as 'male' | 'female' | 'other');
    setShowGenderDropdown(false);
  };

  const getGenderLabel = () => {
    const option = genderOptions.find(opt => opt.value === gender);
    return option ? option.label : 'Select gender';
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; age?: string; gender?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Patient name is required';
    }
    
    // Age validation - now mandatory
    if (!age.trim()) {
      newErrors.age = 'Age is required';
    } else {
      const ageNum = parseInt(age.trim(), 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
        newErrors.age = 'Please enter a valid age (0-150)';
      }
    }
    
    // Gender validation - now mandatory
    if (!gender) {
      newErrors.gender = 'Gender is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (existingPatient) {
        const updatedPatientData: Patient = {
          ...existingPatient,
          name: name.trim(),
          age: parseInt(age.trim(), 10),
          gender: gender as 'male' | 'female' | 'other',
        };
        
        await updatePatient(updatedPatientData);
        onSave(updatedPatientData);
      } else {
        const newPatient = await savePatient({
          name: name.trim(),
          age: parseInt(age.trim(), 10),
          gender: gender as 'male' | 'female' | 'other',
        });
        
        onSave(newPatient);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save patient information');
      console.error('Error saving patient:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <Text style={[styles.title, { color: theme.textColor }]}>
          {existingPatient ? 'Edit Patient' : 'Add New Patient'}
        </Text>
      
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textColor }]}>Patient Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.borderColor }, errors.name ? styles.inputError : null]}
          value={name}
          onChangeText={setName}
          placeholder="Enter patient name"
          autoCapitalize="words"
          placeholderTextColor={isDarkMode ? '#888888' : '#999999'}
        />
        {errors.name ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.name}</Text> : null}
      </View>
      

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textColor }]}>Age</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.borderColor }, errors.age ? styles.inputError : null]}
          value={age}
          onChangeText={setAge}
          placeholder="Enter age"
          keyboardType="numeric"
          placeholderTextColor={isDarkMode ? '#888888' : '#999999'}
        />
        {errors.age ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.age}</Text> : null}
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: theme.textColor }]}>Gender</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, { backgroundColor: theme.inputBackground, borderColor: theme.borderColor }, errors.gender ? styles.inputError : null]}
          onPress={() => setShowGenderDropdown(true)}
        >
          <Text style={[styles.dropdownText, { color: gender ? theme.textColor : (isDarkMode ? '#888888' : '#999999') }]}>
            {getGenderLabel()}
          </Text>
          <ChevronDown size={20} color={isDarkMode ? '#888888' : '#999999'} />
        </TouchableOpacity>
        {errors.gender ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.gender}</Text> : null}
      </View>

      <Modal
        visible={showGenderDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderDropdown(false)}
        >
          <View style={[styles.dropdownModal, { backgroundColor: theme.inputBackground }]}>
            <FlatList
              data={genderOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: theme.borderColor }]}
                  onPress={() => handleGenderSelect(item.value)}
                >
                  <Text style={[styles.dropdownItemText, { color: theme.textColor }]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.cancelButtonBackground }]}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={[styles.cancelButtonText, { color: theme.textColor }]}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.saveButtonBackground }, isSubmitting ? styles.disabledButton : null]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={[styles.saveButtonText, { color: theme.buttonTextColor }]}>
            {isSubmitting ? 'Saving...' : existingPatient ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
      
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
  },
  dropdownText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '80%',
    maxHeight: 200,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 5,
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
  cancelButton: {
    backgroundColor: '#E5E5EA',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
