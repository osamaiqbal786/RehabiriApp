import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  visible: boolean;
  type: MessageType;
  message: string;
}

export default function StatusMessage({ visible, type, message }: StatusMessageProps) {
  if (!visible) return null;

  const getMessageStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: styles.successContainer,
          text: styles.successText,
        };
      case 'error':
        return {
          container: styles.errorContainer,
          text: styles.errorText,
        };
      case 'warning':
        return {
          container: styles.warningContainer,
          text: styles.warningText,
        };
      case 'info':
        return {
          container: styles.infoContainer,
          text: styles.infoText,
        };
      default:
        return {
          container: styles.infoContainer,
          text: styles.infoText,
        };
    }
  };

  const messageStyles = getMessageStyles();

  return (
    <View style={[styles.baseContainer, messageStyles.container]}>
      <Text style={[styles.baseText, messageStyles.text]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  baseText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Success styles
  successContainer: {
    backgroundColor: '#34C75920',
    borderLeftColor: '#34C759',
  },
  successText: {
    color: '#34C759',
  },
  // Error styles
  errorContainer: {
    backgroundColor: '#FF453A20',
    borderLeftColor: '#FF453A',
  },
  errorText: {
    color: '#FF453A',
  },
  // Warning styles
  warningContainer: {
    backgroundColor: '#FF950020',
    borderLeftColor: '#FF9500',
  },
  warningText: {
    color: '#FF9500',
  },
  // Info styles
  infoContainer: {
    backgroundColor: '#007AFF20',
    borderLeftColor: '#007AFF',
  },
  infoText: {
    color: '#007AFF',
  },
});
