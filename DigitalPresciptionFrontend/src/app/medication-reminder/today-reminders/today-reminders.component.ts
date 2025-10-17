import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MedicationReminderService } from '../../services/medication-reminder.service'; 
import { MedicationReminder } from '../../models/reminder.model';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Component({
  standalone: true, 
  imports: [CommonModule], 
  selector: 'app-today-reminders',
  templateUrl: './today-reminders.component.html',
  styleUrls: ['./today-reminders.component.css'],
})
export class TodayRemindersComponent implements OnInit {
  reminders: MedicationReminder[] = [];
  loading = true; // Initialize to true
  errorMessage: string | null = null;
  private authHeaders: HttpHeaders | undefined; 

  constructor(
    private reminderService: MedicationReminderService,
    @Inject(PLATFORM_ID) private platformId: Object, // Inject platform ID
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // CRITICAL FIX 1 (SSR Refinement): Check if the code is running in the browser environment (client-side)
    if (!isPlatformBrowser(this.platformId)) {
      // If running on the server (SSR), exit ngOnInit early. 
      // Keep loading=true to prevent a hydration mismatch for the loading indicator.
      return;
    }

    // 1. Manually check token and set headers on initialization
    const token = localStorage.getItem('jwtToken');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'ROLE_PATIENT') {
        this.errorMessage = 'You must be logged in as a Patient to view reminders.';
        this.loading = false;
        return;
    }

    this.authHeaders = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
    // 2. Load reminders using the newly created headers
    this.loadReminders();
  }

  loadReminders(): void {
    if (!this.authHeaders) {
        this.errorMessage = this.errorMessage || 'Authentication failed.';
        this.loading = false;
        return;
    }

    this.loading = true; // Set loading state before API call
    this.errorMessage = null;

    this.reminderService.getTodayReminders(this.authHeaders).subscribe({
      next: (data: MedicationReminder[]) => {
        this.reminders = data;
        this.loading = false; // Reset loading state on success
        
        // CRITICAL FIX 2: Force Change Detection
        this.cdr.detectChanges(); 
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 403) {
          this.errorMessage = 'Permission denied (403). Check your role.';
        } else if (error.status === 401) {
          this.errorMessage = 'Unauthorized (401). Session expired.';
        } else {
          this.errorMessage = `Failed to load reminders. Server error: ${error.statusText || error.message}`;
        }
        this.loading = false; // Reset loading state on error
        this.cdr.detectChanges(); // Force Change Detection on error too
        console.error('API Error:', error);
      }
    });
  }

  markAsTaken(reminder: MedicationReminder): void {
    if (reminder.taken || !this.authHeaders) {
      return;
    }

    const medId = reminder.id;
    reminder.taken = true; 

    this.reminderService.markTaken(medId, this.authHeaders).subscribe({
      next: () => {
        console.log(`Successfully marked ${reminder.medication.medicationName} as taken.`);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to mark as taken:', err);
        alert('Could not update reminder status. Please try again.');
        reminder.taken = false; 
        this.cdr.detectChanges(); // Force repaint on failure
      }
    });
  }
}
