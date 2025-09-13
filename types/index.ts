export interface Patient {
  id: string;
  userId: string; // ID of the user who created this patient
  name: string;
  contactNumber?: string; // Made optional
  age: number; // Made mandatory
  gender: 'male' | 'female' | 'other'; // Made mandatory
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string; // ID of the user who created this session
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  notes: string;
  completed: boolean;
  cancelled: boolean;
  amount?: number;
  createdAt: string;
}

export interface SessionFilter {
  patientId?: string;
  startDate?: string;
  endDate?: string;
  userId?: string; // Added to filter by user
  includeCancelled?: boolean; // Include cancelled sessions in filter
}

export interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  password: string; // Note: This will be hashed in a real app
  address?: {
    houseNumber?: string;
    area?: string;
    pincode?: string;
    city?: string;
    state?: string;
  };
  highestQualification?: string;
  createdAt: string;
}