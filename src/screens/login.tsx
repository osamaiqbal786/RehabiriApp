import React, { useState, useEffect } from 'react';
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
  Keyboard,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { useNotifications } from '../context/NotificationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PermissionRequest from '../components/PermissionRequest';
import LinearGradient from 'react-native-linear-gradient';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, isLoading } = useAuth();
  const { dispatch } = useAppState();
  const { initializeFCMForAuthenticatedUser } = useNotifications();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [isReady, setIsReady] = useState(false);
  const insets = useSafeAreaInsets();

  // Wait for color scheme to be detected before showing content
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);


  // Define theme colors based on color scheme
  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    cardBackground: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    textColor: isDarkMode ? '#FFFFFF' : '#333333',
    subtitleColor: isDarkMode ? '#BBBBBB' : '#666666',
    inputBackground: isDarkMode ? '#3A3A3A' : '#FFFFFF',
    inputBorder: isDarkMode ? '#444444' : '#E5E5E5',
    placeholderColor: isDarkMode ? '#888888' : '#999999',
    primaryColor: isDarkMode ? '#0A84FF' : '#00143f',
    errorColor: '#FF453A',
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(email, password);
      
      // Initialize FCM for authenticated user
      await initializeFCMForAuthenticatedUser();
      
      // Trigger data refresh after successful login
      dispatch({ type: 'TRIGGER_PATIENTS_REFRESH' });
      dispatch({ type: 'TRIGGER_SESSIONS_REFRESH' });
      
      navigation.navigate('MainTabs' as never);
    } catch {
      Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
    }
  };

  const navigateToSignup = () => {
    navigation.navigate('Signup' as never);
  };

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={isDarkMode ? ['#1E1E1E', '#2A2A2A', '#1E1E1E'] : ['#00143f', '#003d82', '#0066cc']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar 
        barStyle="light-content" 
        translucent 
        backgroundColor="transparent" 
      />
      <PermissionRequest delay={1000} />
      
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
              {/* Header Section */}
              <View style={[styles.header, { paddingTop: insets.top + 40 }]}>
              {/* Decorative circles */}
              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />
              
              {/* Logo */}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <View style={styles.logoInnerCircle}>
                    <Image 
                      source={require('../../assets/images/rehabiri-light-icon.png')}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>
              
              <Text style={styles.title}>Rehabiri</Text>
              <Text style={styles.subtitle}>Welcome Back</Text>
              <View style={styles.divider} />
              <Text style={styles.tagline}>Your Practice, Simplified</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={[styles.form, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.textColor }]}>Email Address</Text>
                  <View style={[
                    styles.inputWrapper,
                    { borderColor: errors.email ? theme.errorColor : theme.inputBorder }
                  ]}>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: theme.inputBackground, 
                          color: theme.textColor
                        }
                      ]}
                      placeholder="Enter your email"
                      placeholderTextColor={theme.placeholderColor}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.email && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.email}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.textColor }]}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    { borderColor: errors.password ? theme.errorColor : theme.inputBorder }
                  ]}>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: theme.inputBackground, 
                          color: theme.textColor
                        }
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor={theme.placeholderColor}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                  {errors.password && <Text style={[styles.errorText, { color: theme.errorColor }]}>{errors.password}</Text>}
                </View>

                <LinearGradient
                  colors={isDarkMode ? ['#0A84FF', '#0066CC'] : ['#00143f', '#002d5c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.buttonGradient, isLoading && styles.buttonDisabled]}
                >
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Login</Text>
                    )}
                  </TouchableOpacity>
                </LinearGradient>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('ForgotPassword' as never)}
                  style={styles.forgotPasswordContainer}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.forgotPasswordText, { color: theme.primaryColor }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text style={[styles.signupText, { color: theme.subtitleColor }]}>Don't have an account? </Text>
                  <TouchableOpacity onPress={navigateToSignup} activeOpacity={0.7}>
                    <Text style={[styles.signupLink, { color: theme.primaryColor }]}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: 20,
    left: -30,
  },
  logoContainer: {
    marginBottom: 15,
    zIndex: 1,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoInnerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    letterSpacing: 1,
    zIndex: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#B3D9FF',
    fontWeight: '500',
    zIndex: 1,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
    marginVertical: 8,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  formCard: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  form: {
    borderRadius: 24,
    padding: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    padding: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
  },
  buttonGradient: {
    borderRadius: 12,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#00143f',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  button: {
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
