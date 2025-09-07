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
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(() => resolve(undefined), 2000));
      setEmailSent(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  if (emailSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.textColor }]}>Check Your Email</Text>
          <Text style={[styles.subtitle, { color: theme.subtitleColor }]}>
            We've sent a password reset link to {email}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primaryColor }]}
            onPress={navigateToLogin}
          >
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.textColor }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: theme.subtitleColor }]}>
            Enter your email address and we'll send you a link to reset your password
          </Text>

          <View style={[styles.form, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textColor }]}>Email</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.inputBackground, 
                    borderColor: theme.inputBorder,
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
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primaryColor }]}
              onPress={handleResetPassword}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={navigateToLogin}
              style={styles.backToLoginContainer}
              activeOpacity={0.7}
            >
              <Text style={[styles.backToLoginText, { color: theme.primaryColor }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    lineHeight: 22,
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
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '500',
  },
});