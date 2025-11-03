// src/app/models/reminder.model.ts

// ✅ Simplified User Model
export interface User {
  id: number;
  username: string;
  // Add other necessary patient properties if needed
}

// ✅ Represents a single day in the medication schedule
export interface MedicationDay {
  dayNumber: number;
  date: string | Date;
  taken: boolean;
  missed?: boolean;
  isToday: boolean;
}

// ✅ Medication Model (Details for the nested medication object)
export interface Medication {
  id: number;
  medicationName: string;
  dosageTiming: string; // e.g., "Morning" or "Evening"

  // Optional fields provided by the backend
  durationDays?: number;
  startDate?: string;
  endDate?: string;

  // ✅ Added optional property so TypeScript doesn’t complain
  // This is populated locally in the frontend after grouping reminders
  days?: MedicationDay[];
}

// ✅ Medication Reminder Model (Top-level API response object)
export interface MedicationReminder {
  id: number;
  medication: Medication; // Nested object for medication details
  patient: User;          // Nested object for the patient
  date: string;           // Reminder date from API
  taken: boolean;         // Whether it has been marked as taken
}
