import React from 'react';
import { Modal, View, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform } from 'react-native';
import { Session } from '../types';
import SessionForm from './SessionForm';

interface SessionEditModalProps {
  visible: boolean;
  session?: Session;
  onClose: () => void;
  onSave: (session: Session) => void;
}

export default function SessionEditModal({ visible, session, onClose, onSave }: SessionEditModalProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    backgroundColor: isDarkMode ? '#1E1E1E' : '#F2F2F7',
    modalBg: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
            <SessionForm
              existingSession={session}
              onSave={onSave}
              onCancel={onClose}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 10,
    padding: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});
