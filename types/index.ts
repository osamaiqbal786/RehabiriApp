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
  therapistId?: string; // ID of the assigned therapist (for clinic sessions)
  therapistName?: string; // Name of the assigned therapist (for clinic sessions)
  createdAt: string;
  updatedAt?: string; // Last update timestamp
}

export interface SessionFilter {
  patientId?: string;
  clinicId?: string; // Filter by clinic (for therapists viewing clinic sessions)
  startDate?: string;
  endDate?: string;
  userId?: string; // Added to filter by user
  includeCancelled?: boolean; // Include cancelled sessions in filter
}

export interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  eventDate: string;
  eventTime: string;
  location: {
    pincode: string;
    state: string;
    city: string;
    address: string;
  };
  image: {
    url: string;
    thumbnail: string;
    alt: string;
  };
  category: 'workshop' | 'seminar' | 'meetup' | 'conference' | 'training' | 'other';
  tags: string[];
  maxAttendees?: number;
  currentAttendees: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  eligiblePincodes: string[];
}

export interface EventLocation {
  pincode: string;
  state: string;
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
  clinics?: Array<{
    clinicId: string;
    clinicName: string;
    addedAt: string;
  }>;
  createdAt: string;
}