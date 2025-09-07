import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import { useAuth } from '../../utils/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, updateUserProfile, isLoading } = useAuth();
  
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    phoneNumber?: string;
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
      email?: string; 
      phoneNumber?: string;
    } = {};
    let isValid = true;

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

    setErrors(newErrors);
    return isValid;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    try {
      await updateUserProfile({
        email,
        phoneNumber,
        profileImage: profileImage || undefined,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Failed to update profile. Please try again.');
    }
  };

  const pickImage = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Photo Library', onPress: () => openImageLibrary() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as PhotoQuality,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }
      
      if (response.errorMessage) {
        Alert.alert('Camera Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          setProfileImage(asset.uri);
        }
      }
    });
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as PhotoQuality,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }
      
      if (response.errorMessage) {
        Alert.alert('Image Library Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          setProfileImage(asset.uri);
        }
      }
    });
  };


  const handleCancel = () => {
    setEmail(user?.email || '');
    setPhoneNumber(user?.phoneNumber || '');
    setProfileImage(user?.profileImage || null);
    setErrors({});
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image Section */}
        <View style={[styles.profileImageContainer, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.imageWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: theme.primaryColor }]}>
                <Text style={styles.placeholderText}>
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </View>
          
          {isEditing && (
            <TouchableOpacity 
              style={[styles.changeImageButton, { backgroundColor: theme.primaryColor }]}
              onPress={pickImage}
            >
              <Text style={styles.changeImageText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Information */}
        <View style={[styles.profileInfoContainer, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textColor }]}>Name</Text>
            <Text style={[styles.fieldValue, { color: theme.textColor }]}>
              {user?.email || 'Not provided'}
            </Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  profileImageContainer: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageWrapper: {
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  changeImageButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeImageText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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