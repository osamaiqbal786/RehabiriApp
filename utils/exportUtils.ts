import * as XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import Share from 'react-native-share';
import { Session } from '../types';

/**
 * Formats a session for Excel export by creating a flattened object with readable properties
 */
const formatSessionForExport = (session: Session) => {
  // Format date for better readability
  const formattedDate = new Date(session.date).toLocaleDateString();
  
  // Determine session status
  let status = 'Pending';
  if (session.completed) {
    status = 'Completed';
  } else if (session.cancelled) {
    status = 'Cancelled';
  }
  
  // Format amount
  const amount = session.amount !== undefined ? `₹${session.amount.toFixed(2)}` : '-';
  
  return {
    'Patient Name': session.patientName,
    'Date': formattedDate,
    'Status': status,
    'Amount': amount,
  };
};

/**
 * Request storage permissions for Android (handles different Android versions)
 */
const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  
  try {
    // For Android 13+ (API 33+), we need different permissions
    const androidVersion = typeof Platform.Version === 'string' ? parseInt(Platform.Version) : Platform.Version;
    console.log('Android version:', androidVersion);
    
    if (androidVersion >= 33) {
      // For Android 13+, WRITE_EXTERNAL_STORAGE is ignored
      // We use app-specific storage which doesn't require permissions
      console.log('Android 13+: Using app-specific storage (no permission needed)');
      return true;
    } else if (androidVersion >= 30) {
      // Android 11-12 (API 30-32)
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to storage to save Excel files',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Permission Required',
          'Storage permission has been permanently denied. Please enable it in app settings to export files.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              console.log('User needs to manually open app settings');
            }}
          ]
        );
        return false;
      }
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // Android 10 and below
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to storage to save Excel files',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Permission Required',
          'Storage permission has been permanently denied. Please enable it in app settings to export files.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              console.log('User needs to manually open app settings');
            }}
          ]
        );
        return false;
      }
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
};

/**
 * Get the appropriate file path for different platforms and Android versions
 */
const getFilePath = async (fileName: string): Promise<string> => {
  if (Platform.OS === 'ios') {
    return `${RNFS.DocumentDirectoryPath}/${fileName}`;
  }
  
  // Android logic
  // const androidVersion = typeof Platform.Version === 'string' ? parseInt(Platform.Version) : Platform.Version;
  
  // if (androidVersion >= 30) {
  //   // For Android 11+, use app-specific external storage
  //   // This doesn't require WRITE_EXTERNAL_STORAGE permission
  //   return `${RNFS.ExternalDirectoryPath}/${fileName}`;
  // } else {
    // For older Android versions, try Downloads folder first
    try {
      const downloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download`;
      
      // Check if Downloads directory exists, create if it doesn't
      const downloadsDirExists = await RNFS.exists(downloadsPath);
      if (!downloadsDirExists) {
        await RNFS.mkdir(downloadsPath);
      }
      
      return `${downloadsPath}/${fileName}`;
    } catch (error) {
      console.error('Failed to access Downloads folder:', error);
      // Fallback to external directory
      return `${RNFS.ExternalDirectoryPath}/${fileName}`;
    }
  // }
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

/**
 * Main export function - Exports sessions to an Excel file and shares it
 */
export const exportSessionsToExcel = async (sessions: Session[], patientName: string): Promise<boolean> => {
  let fileUri: string | undefined;
  
  try {
    // Validate input
    if (!sessions || sessions.length === 0) {
      Alert.alert('No Data', 'No sessions found to export.');
      return false;
    }
    
    // Use "All_Patients" if no patient name provided
    const displayPatientName = patientName && patientName.trim() !== '' ? patientName : 'All_Patients';
    
    // Request storage permission
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required', 
        'Storage permission is required to save Excel files. Please grant permission in app settings.'
      );
      return false;
    }
    
    // Show loading state
    console.log('Starting Excel export for:', patientName);
    console.log('Display patient name will be:', displayPatientName);
    
    // Create Excel workbook
    const workbook = createExcelWorkbook(sessions);
    
    // Generate Excel file as base64
    const wbout = XLSX.write(workbook, { 
      type: 'base64', 
      bookType: 'xlsx',
      compression: true 
    });
    
    // Create filename with patient name and timestamp
    const sanitizedPatientName = displayPatientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const fileName = `${sanitizedPatientName}_Sessions_${dateStr}_${timeStr}.xlsx`;
    
    // Get appropriate file path
    fileUri = await getFilePath(fileName);
    console.log('Saving file to:', fileUri);
    
    // Write file to storage
    await RNFS.writeFile(fileUri, wbout, 'base64');
    
    // Verify file was created
    const fileExists = await RNFS.exists(fileUri);
    if (!fileExists) {
      throw new Error('File was not created successfully');
    }
    
    // Get file stats for verification
    const fileStats = await RNFS.stat(fileUri);
    console.log('File created successfully:', {
      path: fileUri,
      size: fileStats.size,
      fileName: fileName,
    });
    
    // Prepare share options
    const shareOptions = {
      title: `${displayPatientName} - Sessions Export`,
      message: `Sessions export for ${displayPatientName}\nGenerated on ${new Date().toLocaleDateString()}`,
      url: `file://${fileUri}`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: fileName,
      // saveToFiles: Platform.OS === 'ios', // iOS specific - allows saving to Files app
      showAppsToView: true, // Show apps that can view the file
    };
    
    // Share the file
    try {
      const result = await Share.open(shareOptions);
      console.log('Share result:', result);
      
      // Show success message
      // const androidVersion = typeof Platform.Version === 'string' ? parseInt(Platform.Version) : Platform.Version;
      let successMessage = `Excel file created successfully!\n\nFile: ${fileName}`;
      
      // if (Platform.OS === 'android' && androidVersion >= 30) {
      //   successMessage += '\n\nThe file has been saved and can be accessed through the share menu.';
      // }
      
      Alert.alert('Export Successful! 📊', successMessage, [{ text: 'OK' }]);
      return true;
      
    } catch (shareError: any) {
      // Clean up the file if it was created but export failed
      try {
        if (fileUri) {
          const fileExists = await RNFS.exists(fileUri);
          if (fileExists) {
            await RNFS.unlink(fileUri);
            console.log('Cleaned up failed export file on user reject:', fileUri);
          }
        }
      } catch (cleanupError) {
        console.error('Error cleaning up failed export file:', cleanupError);
      }
      // console.log('Share error:', shareError);
      
      // // Handle different share error scenarios
      // if (shareError.message) {
      //   if (shareError.message.includes('User did not share') || 
      //       shareError.message.includes('cancelled') ||
      //       shareError.message.includes('dismiss')) {
      //     // User cancelled sharing - this is normal behavior
      //     Alert.alert(
      //       'File Ready', 
      //       `Excel file has been created successfully!\n\nFile: ${fileName}\n\nYou can find it in your device storage.`,
      //       [{ text: 'OK' }]
      //     );
      //     return true;
      //   }
      // }
      return true;
    }
    
  } catch (error) {
    console.error('Error exporting sessions to Excel:', error);
    
    // Clean up the file if it was created but export failed
    try {
      if (fileUri) {
        const fileExists = await RNFS.exists(fileUri);
        if (fileExists) {
          await RNFS.unlink(fileUri);
          console.log('Cleaned up failed export file:', fileUri);
        }
      }
    } catch (cleanupError) {
      console.error('Error cleaning up failed export file:', cleanupError);
    }
    
    // Provide detailed error information
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    Alert.alert(
      'Export Failed', 
      `Failed to export Excel file.\n\nError: ${errorMessage}\n\nPlease try again. If the problem persists, contact support.`,
      [{ text: 'OK' }]
    );
    return false;
  }
};