import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  useColorScheme,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../utils/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import OTPVerification from '../../components/OTPVerification';
import { sendOTP } from '../../utils/mongoAuth';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [highestQualification, setHighestQualification] = useState('');
  const [errors, setErrors] = useState<{ 
    email?: string; 
    name?: string;
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
    houseNumber?: string;
    area?: string;
    pincode?: string;
    city?: string;
    state?: string;
    highestQualification?: string;
  }>({});
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  
  const { register, isLoading } = useAuth();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Define theme colors based on color scheme
  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    cardBackground: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    textColor: isDarkMode ? '#FFFFFF' : '#333333',
    subtitleColor: isDarkMode ? '#BBBBBB' : '#666666',
    inputBackground: isDarkMode ? '#3A3A3A' : '#FAFAFA',
    inputBorder: isDarkMode ? '#444444' : '#DDDDDD',
    placeholderColor: isDarkMode ? '#888888' : '#999999',
    primaryColor: '#0A84FF',
    errorColor: '#FF453A',
  };

  const validateForm = () => {
    const newErrors: { 
      email?: string; 
      name?: string;
      phoneNumber?: string;
      password?: string;
      confirmPassword?: string;
      houseNumber?: string;
      area?: string;
      pincode?: string;
      city?: string;
      state?: string;
      highestQualification?: string;
    } = {};
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

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

  const handleSendOTP = async () => {
    if (!validateForm()) return;

    setIsSendingOTP(true);
    try {
      console.log('Sending OTP request for email:', email);
      
      const response = await sendOTP(email);
      console.log('OTP response:', response);

      setShowOTPVerification(true);
      Alert.alert('OTP Sent', 'Please check your email for the verification code.');
    } catch (error) {
      console.error('OTP send error:', error);
      Alert.alert('Error', (error as Error).message || 'Failed to send OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleOTPVerificationSuccess = async () => {
    try {
      // Create user account after OTP verification
      await register({ 
        email, 
        name,
        phoneNumber, 
        password,
        address: {
          houseNumber,
          area,
          pincode,
          city,
          state
        },
        highestQualification
      });
      // User is automatically signed in after registration
      navigation.navigate('MainTabs' as never);
    } catch (error) {
      Alert.alert('Signup Failed', 'Failed to create account. Please try again.');
    }
  };

  const handleBackFromOTP = () => {
    setShowOTPVerification(false);
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  // Show OTP verification if needed
  if (showOTPVerification) {
    return (
      <OTPVerification
        email={email}
        onVerificationSuccess={handleOTPVerificationSuccess}
        onBack={handleBackFromOTP}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: theme.textColor }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.subtitleColor }]}>Join Rehabiri</Text>

          <View style={[styles.form, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>Name</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.name ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.placeholderColor}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              {errors.name ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.name}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>Email</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.email ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={theme.placeholderColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>Phone Number</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.phoneNumber ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.placeholderColor}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              {errors.phoneNumber ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.phoneNumber}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>Password</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.password ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="Enter your password"
                placeholderTextColor={theme.placeholderColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {errors.password ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.password}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>Confirm Password</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.confirmPassword ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.placeholderColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              {errors.confirmPassword ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.confirmPassword}</Text> : null}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Address Details</Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>House Number</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.houseNumber ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="Enter house number"
                placeholderTextColor={theme.placeholderColor}
                value={houseNumber}
                onChangeText={setHouseNumber}
              />
              {errors.houseNumber ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.houseNumber}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>Area</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.area ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="Enter area/locality"
                placeholderTextColor={theme.placeholderColor}
                value={area}
                onChangeText={setArea}
                autoCapitalize="words"
              />
              {errors.area ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.area}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>Pincode</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.pincode ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="Enter pincode"
                placeholderTextColor={theme.placeholderColor}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
              />
              {errors.pincode ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.pincode}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>City</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.city ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="Enter city"
                placeholderTextColor={theme.placeholderColor}
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
              {errors.city ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.city}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>State</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.state ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="Enter state"
                placeholderTextColor={theme.placeholderColor}
                value={state}
                onChangeText={setState}
                autoCapitalize="words"
              />
              {errors.state ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.state}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>Highest Qualification</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: errors.highestQualification ? theme.errorColor : theme.inputBorder,
                    color: theme.textColor
                  }
                ]}
                placeholder="e.g., BPT, MPT, PhD, etc."
                placeholderTextColor={theme.placeholderColor}
                value={highestQualification}
                onChangeText={setHighestQualification}
                autoCapitalize="words"
              />
              {errors.highestQualification ? <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.highestQualification}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primaryColor }]}
              onPress={handleSendOTP}
              disabled={isLoading || isSendingOTP}
              activeOpacity={0.7}
            >
              {isLoading || isSendingOTP ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.subtitleColor }]}>Already have an account?</Text>
              <TouchableOpacity onPress={navigateToLogin} activeOpacity={0.7}>
                <Text style={[styles.loginLink, { color: theme.primaryColor }]}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.bottomPadding} />
        </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 30,
  },
  form: {
    borderRadius: 10,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 5,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  bottomPadding: {
    height: 100,
  },
});