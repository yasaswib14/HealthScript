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
  styleUrls: ['./today-reminders.component.css']
})
export class TodayRemindersComponent implements OnInit {
  reminders: MedicationReminder[] = [];
  groupedReminders: any[] = [];
  loading = true;
  errorMessage: string | null = null;
  private authHeaders?: HttpHeaders;
  currentDate = new Date();

  // Status constants for better readability
  readonly STATUS = {
    TAKEN: 'taken',
    MISSED: 'missed',
    PENDING: 'pending',
    UPCOMING: 'upcoming'
  };

  constructor(
    private reminderService: MedicationReminderService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('jwtToken');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'ROLE_PATIENT') {
      this.errorMessage = 'You must be logged in as a Patient to view reminders.';
      this.loading = false;
      return;
    }

    this.authHeaders = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.loadReminders();
  }

  loadReminders(): void {
    if (!this.authHeaders) {
      this.errorMessage = 'Authentication failed.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.reminderService.getTodayReminders(this.authHeaders).subscribe({
      next: (data: MedicationReminder[]) => {
        this.reminders = Array.isArray(data) ? data : [];
        this.groupRemindersByMedication();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        console.error('❌ Error fetching reminders:', error);
        this.errorMessage =
          error.status === 401
            ? 'Unauthorized (401): Please log in again.'
            : error.status === 403
              ? 'Permission denied (403): You are not authorized.'
              : `Failed to load reminders (Server Error ${error.status}).`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Get the status of a reminder day
   */
  getReminderStatus(day: any): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);

    if (day.taken) {
      return this.STATUS.TAKEN;
    }
    
    if (dayDate < today) {
      return this.STATUS.MISSED;
    }
    
    if (dayDate.getTime() === today.getTime()) {
      return this.STATUS.PENDING;
    }
    
    return this.STATUS.UPCOMING;
  }

  /**
   * Calculate the progress percentage for a medication
   */
  calculateProgress(medication: any): number {
    if (!medication.days.length) return 0;
    const daysUpToToday = medication.days.filter((d: any) => {
      const dayDate = new Date(d.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate <= today;
    });

    if (!daysUpToToday.length) return 0;

    const takenDays = daysUpToToday.filter((d: any) => d.taken).length;
    return Math.round((takenDays / daysUpToToday.length) * 100);
  }

  /**
   * Format a date to a human-readable string
   */
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Check if a date is today
   */
  isToday(date: Date | string): boolean {
    const d = new Date(date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }

  /**
   * Calculate remaining days for a medication
   */
  getRemainingDays(medication: any): number {
    const lastDay = medication.days[medication.days.length - 1];
    if (!lastDay) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(lastDay.date);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Generate an array of days for a medication reminder
   */
  /**
   * Get active (non-taken) days for the medication
   */
  getActiveDays(reminder: any): any[] {
    return this.getAllDays(reminder).filter(day => !day.taken);
  }

  /**
   * Get completed (taken) days for the medication
   */
  getCompletedDays(reminder: any): any[] {
    return this.getAllDays(reminder).filter(day => day.taken);
  }

  /**
   * Generate an array of all days for a medication reminder
   */
  private getAllDays(reminder: any): any[] {
    const startDate = new Date(reminder.medication.startDate);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
    
    for (let i = 0; i < reminder.medication.durationDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
      
      const day = {
        dayNumber: i + 1,
        date: currentDate,
        taken: false,
        missed: false,
        isToday: currentDate.getTime() === today.getTime()
      };

      // Check if this day has a record
      const record = reminder.medication.days?.find((d: any) => 
        this.isSameDay(new Date(d.date), currentDate)
      );

      // If the medication was taken, mark it as taken
      if (record && record.taken) {
        day.taken = true;
      } else if (!day.taken && currentDate < today) {
        // Only mark as missed if it's a past date and wasn't taken
        day.missed = true;
      }

      days.push(day);
    }
    
    return days;
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Get appropriate status text for display
   */
  getStatusText(day: any): string {
    if (day.taken) return 'Taken';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);

    if (dayDate < today && !day.taken) return 'Missed';
    if (day.isToday) return 'Due Today';
    return 'Upcoming';
  }

  /**
   * Check if medication course is completed
   */
  isCourseCompleted(reminder: any): boolean {
    return this.getActiveDays(reminder).length === 0;
  }

  /**
   * Check if a reminder is missed
   */
  isMissed(reminder: any): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminderDate = new Date(reminder.date);
    reminderDate.setHours(0, 0, 0, 0);
    return !reminder.taken && reminderDate < today;
  }

  /**
   * Get the day number for a reminder
   */
  getDayNumber(reminder: any): number {
    const startDate = new Date(reminder.medication.startDate);
    const reminderDate = new Date(reminder.date);
    startDate.setHours(0, 0, 0, 0);
    reminderDate.setHours(0, 0, 0, 0);
    const diffTime = reminderDate.getTime() - startDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Mark a reminder as taken
   */
  markTaken(medicationId: number): void {
    if (!this.authHeaders) return;
    
    this.reminderService.markTaken(medicationId, this.authHeaders).subscribe({
      next: () => {
        console.log(`✅ Marked ${medicationId} as taken`);
        this.loadReminders(); // refresh to stay in sync
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Failed to mark as taken:', err);
        alert('Could not update reminder status. Please try again.');
      }
    });
  }

  /**
   * Calculate progress percentage for a reminder
   */
  getProgressPercentage(reminder: any): number {
    const totalDays = reminder.medication.durationDays;
    if (!totalDays) return 0;

    const takenDays = reminder.medication.days?.filter((d: any) => d.taken)?.length || 0;
    return Math.round((takenDays / totalDays) * 100);
  }

  /**
   * Get days remaining for a reminder
   */
  getDaysRemaining(reminder: any): number {
    const endDate = new Date(reminder.medication.startDate);
    endDate.setDate(endDate.getDate() + reminder.medication.durationDays - 1);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * ✅ Groups all reminders by medication
   */
  private groupRemindersByMedication(): void {
    const medMap = new Map<number, any>();

    for (const reminder of this.reminders) {
      const med = reminder.medication;
      if (!medMap.has(med.id)) {
        medMap.set(med.id, {
          medicationId: med.id,
          medicationName: med.medicationName,
          dosageTiming: med.dosageTiming,
          durationDays: med.durationDays,
          // ✅ safe fallback if startDate is missing
          startDate: med.startDate ? new Date(med.startDate) : new Date(),
          days: [] as any[]
        });
      }

      const group = medMap.get(med.id);

      // ✅ calculate day number safely (based on startDate)
      const medStart = group.startDate;
      const reminderDate = new Date(reminder.date);
      const diffDays = Math.floor(
        (reminderDate.getTime() - medStart.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1; // +1 because day count starts at 1

      group.days.push({
        dayNumber: diffDays,
        date: reminderDate,
        taken: reminder.taken,
        isToday: reminderDate.toDateString() === new Date().toDateString()
      });
    }

    // ✅ Fill missing future days (visual placeholders)
    this.groupedReminders = Array.from(medMap.values()).map((g) => {
      const allDays: any[] = [];

      for (let i = 1; i <= g.durationDays; i++) {
        const date = new Date(g.startDate);
        date.setDate(date.getDate() + (i - 1));

        const found = g.days.find((d: any) => d.dayNumber === i);
        allDays.push(
          found || {
            dayNumber: i,
            date,
            taken: false,
            isToday: date.toDateString() === new Date().toDateString()
          }
        );
      }

      g.days = allDays.sort((a: any, b: any) => a.dayNumber - b.dayNumber);
      return g;
    });
  }


  /**
   * ✅ Marks a specific day's checkbox (only today's)
   */
  markDayAsTaken(medicationId: number, day: any): void {
    if (day.taken || !day.isToday || !this.authHeaders) return;

    day.taken = true;
    this.cdr.detectChanges();

    this.reminderService.markTaken(medicationId, this.authHeaders).subscribe({
      next: () => {
        console.log(`✅ Marked ${medicationId}, Day ${day.dayNumber} as taken`);
        this.loadReminders(); // refresh to stay in sync
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Failed to mark as taken:', err);
        alert('Could not update reminder status. Please try again.');
        day.taken = false;
        this.cdr.detectChanges();
      }
    });
  }
}
