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
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../utils/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ 
    email?: string; 
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  
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
      phoneNumber?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
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

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      await register({ email, phoneNumber, password });
      navigation.navigate('Login' as never);
    } catch (error) {
      Alert.alert('Signup Failed', 'Failed to create account. Please try again.');
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
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

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primaryColor }]}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
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