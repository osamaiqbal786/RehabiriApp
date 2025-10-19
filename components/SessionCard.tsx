import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Platform } from 'react-native';
import { Session } from '../types';
import { Clock, CheckCircle, Edit, Trash2, IndianRupee, XCircle } from 'lucide-react-native';

interface SessionCardProps {
  session: Session & { disableActions?: boolean };
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  onToggleComplete: (session: Session, completed: boolean) => void;
  isUpcoming?: boolean;
  showCompleteToggle?: boolean;
  allowEdit?: boolean;
  editDisabled?: boolean;
}

const SessionCard = memo(function SessionCard({ session, onEdit, onDelete, onToggleComplete, isUpcoming = false, showCompleteToggle = true, allowEdit = true, editDisabled = false }: SessionCardProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    backgroundColor: isDarkMode ? '#2A2A2A' : 'white',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    cardBackground: isDarkMode ? '#3C3C3C' : 'white',
    completedCardBackground: isDarkMode ? '#2A3A2A' : '#F2FFF7', // Slightly green tint for completed
    cancelledCardBackground: isDarkMode ? '#3A2A2A' : '#FFF2F2', // Slightly red tint for cancelled
    actionButtonColor: isDarkMode ? '#8E8E93' : '#000000',
    completedTextColor: '#34C759',
    editDeleteColor: '#FF3B30',
    primaryColor: '#0A84FF',
    dateTimeLabelColor: '#8E8E93',
    notesColor: isDarkMode ? '#FFFFFF' : '#000000',
    amountColor: '#34C759',
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatAmount = (amount?: number): string => {
    if (amount === undefined) return 'Not paid';
    return amount.toFixed(2);
  };

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: session.cancelled 
            ? theme.cancelledCardBackground 
            : session.completed 
              ? theme.completedCardBackground 
              : theme.cardBackground,
          borderLeftWidth: session.completed ? 5 : session.cancelled ? 5 : 0,
          borderLeftColor: session.completed ? theme.completedTextColor : session.cancelled ? '#FF3B30' : 'transparent'
        }
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.patientName, { color: theme.textColor }]}>{session.patientName}</Text>
        
        {!session.disableActions && (
          <View style={styles.actionButtons}>
            {showCompleteToggle && (!isUpcoming || session.completed) && (
              <TouchableOpacity 
                style={[
                  styles.iconButton,
                  session.cancelled ? styles.disabledButton : null
                ]}
                onPress={() => !session.cancelled && onToggleComplete(session, !session.completed)}
                disabled={session.cancelled}
              >
                {session.completed ? (
                  <XCircle size={20} color={session.cancelled ? theme.actionButtonColor : theme.editDeleteColor} />
                ) : (
                  <CheckCircle size={20} color={session.cancelled ? theme.actionButtonColor : theme.completedTextColor} />
                )}
              </TouchableOpacity>
            )}
            {allowEdit && (
              <TouchableOpacity 
                style={[
                  styles.iconButton,
                  editDisabled && styles.disabledButton
                ]}
                onPress={() => onEdit(session)}
              >
                <Edit size={20} color={editDisabled ? theme.actionButtonColor : theme.primaryColor} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => onDelete(session.id)}
            >
              <Trash2 size={20} color={theme.editDeleteColor} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.dateTimeContainer}>
        <View style={styles.dateTime}>
          <Text style={[styles.dateTimeLabel, { color: theme.dateTimeLabelColor }]}>Date:</Text>
          <Text style={[styles.dateTimeValue, { color: theme.textColor }]}>{formatDate(session.date)}</Text>
        </View>
        <View style={styles.dateTime}>
          <Clock size={16} color={theme.actionButtonColor} style={styles.timeIcon} />
          <Text style={[styles.dateTimeValue, { color: theme.textColor }]}>{session.time}</Text>
        </View>
      </View>
      
      {session.notes ? (
        <View style={styles.notesContainer}>
          <Text style={[styles.notesLabel, { color: theme.dateTimeLabelColor }]}>Notes:</Text>
          <Text style={[styles.notes, { color: theme.notesColor }]}>{session.notes}</Text>
        </View>
      ) : null}
      
      {session.completed && (
        <View style={styles.statusContainer}>
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Completed</Text>
          </View>
          
          <View style={styles.amountContainer}>
            <IndianRupee size={16} color={theme.amountColor} style={styles.amountIcon} />
            <Text style={[styles.amountText, { color: theme.amountColor }]}>
              {formatAmount(session.amount)}
            </Text>
          </View>
        </View>
      )}
      
      {session.cancelled && (
        <View style={styles.statusContainer}>
          <View style={[styles.completedBadge, { backgroundColor: '#FF3B30' }]}>
            <Text style={styles.completedText}>Cancelled</Text>
          </View>
          
          <View style={styles.amountContainer}>
            <IndianRupee size={16} color="#FF3B30" style={styles.amountIcon} />
            <Text style={[styles.amountText, { color: '#FF3B30' }]}>
              0.00
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 1.41px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeLabel: {
    marginRight: 5,
  },
  dateTimeValue: {
    fontWeight: '500',
  },
  timeIcon: {
    marginRight: 5,
  },
  notesContainer: {
    marginTop: 5,
    marginBottom: 10,
  },
  notesLabel: {
    marginBottom: 3,
  },
  notes: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  completedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  completedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountIcon: {
    marginRight: 5,
  },
  amountText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default SessionCard;
