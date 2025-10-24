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
