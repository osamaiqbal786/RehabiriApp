import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

interface MultiDateCalendarProps {
  visible: boolean;
  onClose: () => void;
  onDatesSelect: (dates: string[]) => void;
  selectedDates?: string[];
  title?: string;
  theme?: any;
  isDarkMode?: boolean;
}

const MultiDateCalendar: React.FC<MultiDateCalendarProps> = ({
  visible,
  onClose,
  onDatesSelect,
  selectedDates = [],
  title = 'Select Session Dates',
  theme,
}) => {
  const [tempSelectedDates, setTempSelectedDates] = useState<string[]>([]);
  const today = new Date().toISOString().split('T')[0];

  // Initialize when modal opens
  useEffect(() => {
    if (visible) {
      setTempSelectedDates([...selectedDates]);
    }
  }, [visible, selectedDates]);

  const handleDatePress = useCallback((day: any) => {
    console.log('🗓️ Date pressed:', day);
    const dateString = day.dateString;
    console.log('🗓️ Date string:', dateString);
    console.log('🗓️ Current selected dates before:', tempSelectedDates);
    
    setTempSelectedDates(prev => {
      console.log('🗓️ Previous state:', prev);
      const newDates = prev.includes(dateString)
        ? prev.filter(date => date !== dateString)
        : [...prev, dateString].sort();
      console.log('🗓️ New dates after update:', newDates);
      return newDates;
    });
  }, [tempSelectedDates]);

  const handleConfirm = useCallback(() => {
    onDatesSelect(tempSelectedDates);
    onClose();
  }, [tempSelectedDates, onDatesSelect, onClose]);

  const handleClear = useCallback(() => {
    setTempSelectedDates([]);
  }, []);

  const handleClose = useCallback(() => {
    setTempSelectedDates([...selectedDates]);
    onClose();
  }, [selectedDates, onClose]);

  const removeDate = useCallback((dateToRemove: string) => {
    setTempSelectedDates(prev => prev.filter(date => date !== dateToRemove));
  }, []);

  // Create marked dates object - very simple and stable
  const markedDates = React.useMemo(() => {
    const marked: any = {};
    tempSelectedDates.forEach(date => {
      marked[date] = {
        selected: true,
        selectedColor: '#007AFF',
        selectedTextColor: '#FFFFFF',
      };
    });
    return marked;
  }, [tempSelectedDates]);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme?.backgroundColor || '#ffffff' }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme?.separatorColor || '#E5E5E7' }]}>
              <Text style={[styles.title, { color: theme?.textColor || '#1C1C1E' }]}>{title}</Text>
              <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: theme?.inputBackground || '#F2F2F7' }]}>
                <Text style={[styles.closeButtonText, { color: theme?.placeholderColor || '#8E8E93' }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Dates Summary */}
            {tempSelectedDates.length > 0 && (
              <View style={[styles.selectedDatesContainer, { borderBottomColor: theme?.separatorColor || '#E5E5E7' }]}>
                <Text style={[styles.selectedDatesTitle, { color: theme?.textColor || '#1C1C1E' }]}>
                  Selected Dates ({tempSelectedDates.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectedDatesList}>
                    {tempSelectedDates.map((date) => (
                      <View key={date} style={styles.selectedDateChip}>
                        <Text style={styles.selectedDateText}>{formatDate(date)}</Text>
                        <TouchableOpacity
                          style={styles.removeDateButton}
                          onPress={() => removeDate(date)}
                        >
                          <Text style={styles.removeDateText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                <TouchableOpacity onPress={handleClear} style={styles.clearAllButton}>
                  <Text style={[styles.clearAllText, { color: theme?.errorColor || '#FF3B30' }]}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={handleDatePress}
                minDate={today}
                maxDate="2030-12-31"
                markedDates={markedDates}
                hideExtraDays={true}
                disableMonthChange={false}
                enableSwipeMonths={true}
                hideArrows={false}
                disableAllTouchEventsForDisabledDays={true}
                disableAllTouchEventsForInactiveDays={true}
                theme={{
                  backgroundColor: theme?.backgroundColor || '#ffffff',
                  calendarBackground: theme?.backgroundColor || '#ffffff',
                  textSectionTitleColor: theme?.placeholderColor || '#b6c1cd',
                  selectedDayBackgroundColor: theme?.primaryColor || '#007AFF',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: theme?.primaryColor || '#007AFF',
                  dayTextColor: theme?.textColor || '#2d4150',
                  textDisabledColor: theme?.placeholderColor || '#d9e1e8',
                  arrowColor: theme?.primaryColor || '#007AFF',
                  monthTextColor: theme?.textColor || '#2d4150',
                  textDayFontWeight: '400',
                  textMonthFontWeight: '600',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                }}
                style={styles.calendar}
              />
            </View>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme?.separatorColor || '#E5E5E7' }]}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: theme?.cancelButtonBg || '#F2F2F7' }]}
                onPress={handleClose}
              >
                <Text style={[styles.cancelButtonText, { color: theme?.textColor || '#1C1C1E' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.confirmButton,
                  { backgroundColor: theme?.primaryColor || '#007AFF' },
                  tempSelectedDates.length === 0 && styles.disabledButton
                ]}
                onPress={handleConfirm}
                disabled={tempSelectedDates.length === 0}
              >
                <Text style={styles.confirmButtonText}>
                  Create {tempSelectedDates.length} Session{tempSelectedDates.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  selectedDatesContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  selectedDatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  selectedDatesList: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  removeDateButton: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeDateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearAllButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearAllText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarContainer: {
    flex: 1,
    padding: 16,
    minHeight: 300,
  },
  calendar: {
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#E5E5EA',
  },
  cancelButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MultiDateCalendar;