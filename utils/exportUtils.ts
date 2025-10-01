import { Alert } from 'react-native';
import Share from 'react-native-share';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { Session } from '../types';

/**
 * Format session data for Excel export
 */
const formatSessionForExport = (session: Session) => {
  // Determine status
  let status = 'Pending';
  if (session.completed) {
    status = 'Completed';
  } else if (session.cancelled) {
    status = 'Cancelled';
  }
  
  return {
    'Patient Name': session.patientName || 'N/A',
    'Date': session.date || 'N/A',
    'Status': status,
    'Amount': `₹${session.amount || '0'}`,
  };
};

/**
 * Create Excel workbook with proper formatting
 */
const createExcelWorkbook = (sessions: Session[]) => {
  // Format the data for export
  const formattedSessions = sessions.map(formatSessionForExport);
  
  // Calculate totals
  const totalAmount = sessions.reduce((sum, session) => {
    return sum + (session.amount || 0);
  }, 0);
  
  const completedSessions = sessions.filter(s => s.completed).length;
  const cancelledSessions = sessions.filter(s => s.cancelled).length;
  const pendingSessions = sessions.length - completedSessions - cancelledSessions;
  
  // Add summary rows
  const summaryRows = [
    {
      'Patient Name': '',
      'Date': '',
      'Status': '',
      'Amount': '',
    },
    {
      'Patient Name': 'SUMMARY',
      'Date': '',
      'Status': '',
      'Amount': '',
    },
    {
      'Patient Name': 'Total Sessions',
      'Date': sessions.length.toString(),
      'Status': '',
      'Amount': '',
    },
    {
      'Patient Name': 'Completed',
      'Date': completedSessions.toString(),
      'Status': '',
      'Amount': '',
    },
    {
      'Patient Name': 'Cancelled',
      'Date': cancelledSessions.toString(),
      'Status': '',
      'Amount': '',
    },
    {
      'Patient Name': 'Pending',
      'Date': pendingSessions.toString(),
      'Status': '',
      'Amount': '',
    },
    {
      'Patient Name': '',
      'Date': '',
      'Status': 'TOTAL',
      'Amount': `₹${totalAmount.toFixed(2)}`,
    },
  ];
  
  // Combine data
  const dataWithSummary = [...formattedSessions, ...summaryRows];
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(dataWithSummary);
  
  // Set column widths for better readability
  const colWidths = [
    { wch: 20 }, // Patient Name
    { wch: 15 }, // Date
    { wch: 12 }, // Status
    { wch: 15 }, // Amount
  ];
  worksheet['!cols'] = colWidths;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sessions');
  
  return workbook;
};

// Export sessions to Excel using cache directory approach
export const exportSessionsToExcel = async (sessions: Session[], patientName?: string): Promise<boolean> => {
  let filePath: string | null = null;
  
  try {
    if (!sessions || sessions.length === 0) {
      Alert.alert('No Data', 'No sessions to export');
      return false;
    }

    console.log('Starting Excel export for:', sessions.length, 'sessions');

    // Create Excel workbook in memory
    const workbook = createExcelWorkbook(sessions);
    
    // Convert to base64
    const wbout = XLSX.write(workbook, { 
      type: 'base64', 
      bookType: 'xlsx' 
    });

    console.log('Excel created in memory, size:', wbout.length, 'characters');

    // Create filename based on patient name
    const filename = patientName 
      ? `${patientName.replace(/\s+/g, '_')}_sessions_${new Date().toISOString().split('T')[0]}.xlsx`
      : `all_sessions_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Use cache directory (no permissions needed)
    filePath = `${RNFS.CachesDirectoryPath}/${filename}`;
    
    console.log('Saving to cache directory:', filePath);
    
    // Write to cache directory
    await RNFS.writeFile(filePath, wbout, 'base64');
    
    console.log('File saved successfully');

    // Create share options
    const shareOptions = {
      title: 'Sessions Export',
      message: 'Rehabiri Sessions Export',
      url: `file://${filePath}`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: filename,
      // saveToFiles: Platform.OS === 'ios', // iOS Files app support
    };

    console.log('Opening share dialog...');
    
    // Share the file
    await Share.open(shareOptions);
    
    // Clean up the temporary file after sharing
    setTimeout(() => {
      if (filePath) {
        RNFS.unlink(filePath).catch(console.log);
      }
    }, 5000);
    
    console.log('Export completed successfully');
    return true;

  } catch (error) {
    // console.error('Export failed:', error);
    // Clean up file if it was created
    if (filePath) {
      RNFS.unlink(filePath).catch(console.log);
    }
    return false;
  }
};
