// src/app/models/reminder.model.ts

// Simplified User Model
export interface User {
  id: number;
  username: string;
  // Add other necessary patient properties if needed
}

// Medication Model (Details for the nested medication object)
export interface Medication {
  id: number;
  medicationName: string; 
  dosageTiming: string; // <-- Now correctly placed here
  // Add other properties found in the nested medication object from the API response:
  durationDays?: number;
  startDate?: string;
  endDate?: string;
}

// Medication Reminder Model (The top-level object from the API)
export interface MedicationReminder {
  id: number;
  // CRITICAL FIX: medication is a nested object of type Medication
  medication: Medication; 
  // CRITICAL FIX: patient is a nested object of type User
  patient: User;
  date: string; 
  taken: boolean;
}
