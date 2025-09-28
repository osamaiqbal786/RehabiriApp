import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  useColorScheme,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useAuth } from '../../utils/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, updateUserProfile, isLoading } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [houseNumber, setHouseNumber] = useState(user?.address?.houseNumber || '');
  const [area, setArea] = useState(user?.address?.area || '');
  const [pincode, setPincode] = useState(user?.address?.pincode || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [state, setState] = useState(user?.address?.state || '');
  const [highestQualification, setHighestQualification] = useState(user?.highestQualification || '');
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<{ 
    name?: string;
    email?: string; 
    phoneNumber?: string;
    houseNumber?: string;
    area?: string;
    pincode?: string;
    city?: string;
    state?: string;
    highestQualification?: string;
  }>({});

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F2F2F7',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    cardBackground: isDarkMode ? '#2A2A2A' : 'white',
    borderColor: isDarkMode ? '#444444' : '#DDDDDD',
    primaryColor: '#0A84FF',
    errorColor: '#FF453A',
    placeholderColor: isDarkMode ? '#888888' : '#999999',
  };

  const validateForm = () => {
    const newErrors: { 
      name?: string;
      email?: string; 
      phoneNumber?: string;
      houseNumber?: string;
      area?: string;
      pincode?: string;
      city?: string;
      state?: string;
      highestQualification?: string;
    } = {};
    let isValid = true;

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    // Phone number validation
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
      isValid = false;
    }

    // Address validation
    if (!houseNumber.trim()) {
      newErrors.houseNumber = 'House number is required';
      isValid = false;
    }

    if (!area.trim()) {
      newErrors.area = 'Area is required';
      isValid = false;
    }

    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
      isValid = false;
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
      isValid = false;
    }

    if (!state.trim()) {
      newErrors.state = 'State is required';
      isValid = false;
    }

    if (!highestQualification.trim()) {
      newErrors.highestQualification = 'Highest qualification is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    try {
      await updateUserProfile({
        name,
        email,
        phoneNumber,
        address: {
          houseNumber,
          area,
          pincode,
          city,
          state
        },
        highestQualification
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Failed to update profile. Please try again.');
    }
  };



  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phoneNumber || '');
    setHouseNumber(user?.address?.houseNumber || '');
    setArea(user?.address?.area || '');
    setPincode(user?.address?.pincode || '');
    setCity(user?.address?.city || '');
    setState(user?.address?.state || '');
    setHighestQualification(user?.highestQualification || '');
    setErrors({});
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Profile Information */}
        <View style={[styles.profileInfoContainer, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textColor }]}>Name</Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: theme.backgroundColor,
                    borderColor: errors.name ? theme.errorColor : theme.borderColor,
                    color: theme.textColor
                  }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={theme.placeholderColor}
                autoCapitalize="words"
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.textColor }]}>
                {user?.name || 'Not provided'}
              </Text>
            )}
            {errors.name && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.name}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textColor }]}>Email</Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: theme.backgroundColor,
                    borderColor: errors.email ? theme.errorColor : theme.borderColor,
                    color: theme.textColor
                  }
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.placeholderColor}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.textColor }]}>
                {user?.email || 'Not provided'}
              </Text>
            )}
            {errors.email && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.email}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textColor }]}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: theme.backgroundColor,
                    borderColor: errors.phoneNumber ? theme.errorColor : theme.borderColor,
                    color: theme.textColor
                  }
                ]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.placeholderColor}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.textColor }]}>
                {user?.phoneNumber || 'Not provided'}
              </Text>
            )}
            {errors.phoneNumber && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.phoneNumber}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textColor }]}>Highest Qualification</Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: theme.backgroundColor,
                    borderColor: errors.highestQualification ? theme.errorColor : theme.borderColor,
                    color: theme.textColor
                  }
                ]}
                value={highestQualification}
                onChangeText={setHighestQualification}
                placeholder="e.g., BPT, MPT, PhD, etc."
                placeholderTextColor={theme.placeholderColor}
                autoCapitalize="words"
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.textColor }]}>
                {user?.highestQualification || 'Not provided'}
              </Text>
            )}
            {errors.highestQualification && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.highestQualification}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textColor }]}>Address</Text>
            {isEditing ? (
              <View>
                <TextInput
                  style={[
                    styles.addressTextInput,
                    { 
                      backgroundColor: theme.backgroundColor,
                      borderColor: errors.houseNumber ? theme.errorColor : theme.borderColor,
                      color: theme.textColor
                    }
                  ]}
                  value={houseNumber}
                  onChangeText={setHouseNumber}
                  placeholder="House Number"
                  placeholderTextColor={theme.placeholderColor}
                />
                <TextInput
                  style={[
                    styles.addressTextInput,
                    { 
                      backgroundColor: theme.backgroundColor,
                      borderColor: errors.area ? theme.errorColor : theme.borderColor,
                      color: theme.textColor
                    }
                  ]}
                  value={area}
                  onChangeText={setArea}
                  placeholder="Area/Locality"
                  placeholderTextColor={theme.placeholderColor}
                  autoCapitalize="words"
                />
                <TextInput
                  style={[
                    styles.addressTextInput,
                    { 
                      backgroundColor: theme.backgroundColor,
                      borderColor: errors.pincode ? theme.errorColor : theme.borderColor,
                      color: theme.textColor
                    }
                  ]}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="Pincode"
                  placeholderTextColor={theme.placeholderColor}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TextInput
                  style={[
                    styles.addressTextInput,
                    { 
                      backgroundColor: theme.backgroundColor,
                      borderColor: errors.city ? theme.errorColor : theme.borderColor,
                      color: theme.textColor
                    }
                  ]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={theme.placeholderColor}
                  autoCapitalize="words"
                />
                <TextInput
                  style={[
                    styles.textInput,
                    { 
                      backgroundColor: theme.backgroundColor,
                      borderColor: errors.state ? theme.errorColor : theme.borderColor,
                      color: theme.textColor
                    }
                  ]}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor={theme.placeholderColor}
                  autoCapitalize="words"
                />
                {errors.houseNumber && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.houseNumber}</Text>}
                {errors.area && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.area}</Text>}
                {errors.pincode && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.pincode}</Text>}
                {errors.city && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.city}</Text>}
                {errors.state && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.state}</Text>}
              </View>
            ) : (
              <Text style={[styles.fieldValue, { color: theme.textColor }]}>
                {user?.address ? 
                  `${user.address.houseNumber || ''}, ${user.address.area || ''}, ${user.address.city || ''}, ${user.address.state || ''} - ${user.address.pincode || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') || 'Not provided'
                  : 'Not provided'
                }
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textColor }]}>Member Since</Text>
            <Text style={[styles.fieldValue, { color: theme.textColor }]}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {isEditing ? (
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: theme.borderColor }]}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textColor }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleUpdateProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: theme.primaryColor }]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileInfoContainer: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    opacity: 0.8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addressTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    marginTop: 5,
  },
  actionButtonsContainer: {
    gap: 15,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  editButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});