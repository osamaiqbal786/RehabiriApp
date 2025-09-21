import * as XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { Share } from 'react-native';
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
 * Exports sessions to an Excel file and shares it
 */
export const exportSessionsToExcel = async (sessions: Session[], patientName: string): Promise<boolean> => {
  try {
    // Format the data for export
    const formattedSessions = sessions.map(formatSessionForExport);
    
    // Calculate total amount
    const totalAmount = sessions.reduce((sum, session) => {
      return sum + (session.amount || 0);
    }, 0);
    
    // Add total row at the end
    const totalRow = {
      'Patient Name': '',
      'Date': '',
      'Status': 'TOTAL',
      'Amount': `₹${totalAmount.toFixed(2)}`,
    };
    
    // Add total row to the data
    const dataWithTotal = [...formattedSessions, totalRow];
    
    // Create a worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet(dataWithTotal);
    
    // Create a workbook with the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sessions');
    
    // Generate the Excel file
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    
    // Create a filename with the patient name and current date
    const fileName = `${patientName.replace(/\s+/g, '_')}_Sessions_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Determine the file path
    const fileUri = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    
    // Write the file
    await RNFS.writeFile(fileUri, wbout, 'base64');
    
    // Share the file
    await Share.share({
      title: 'Sessions Export',
      message: `${patientName}'s Sessions`,
      url: fileUri,
    });
    
    return true;
  } catch (error) {
    console.error('Error exporting sessions:', error);
    return false;
  }
}; 