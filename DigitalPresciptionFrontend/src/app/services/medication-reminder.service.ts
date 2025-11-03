import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { MedicationReminder } from '../models/reminder.model';

@Injectable({
  providedIn: 'root'
})
export class MedicationReminderService {
  private readonly API_PATH = 'http://localhost:8081/patient/reminder';

  // 🔔 Event stream to notify other components (like Dashboard) that reminders changed
  private reminderUpdatedSource = new Subject<void>();
  reminderUpdated$ = this.reminderUpdatedSource.asObservable();

  constructor(private http: HttpClient) { }

  /** Call this when a reminder is updated (e.g., after markTaken succeeds) */
  notifyReminderUpdate(): void {
    this.reminderUpdatedSource.next();
  }

  /**
   * ✅ Fetches today's medication reminders for the logged-in patient.
   */
  getTodayReminders(headers?: HttpHeaders): Observable<MedicationReminder[]> {
    return this.http.get<MedicationReminder[]>(`${this.API_PATH}/today`, { headers });
  }

  /**
   * ✅ Marks a specific medication as taken for the current day.
   * Backend returns a plain string message.
   */
  markTaken(medicationId: number, headers?: HttpHeaders): Observable<string> {
    if (!medicationId) {
      throw new Error('Invalid medication ID passed to markTaken()');
    }

    return this.http.post(
      `${this.API_PATH}/${medicationId}/mark-taken`,
      {},
      {
        headers,
        responseType: 'text' as 'json'
      }
    ) as Observable<string>;
  }

  /**
   * ♻️ Optional utility: Manually resets daily reminders (for testing).
   */
  resetDaily(headers?: HttpHeaders): Observable<string> {
    return this.http.post(
      `${this.API_PATH}/reset-daily`,
      {},
      {
        headers,
        responseType: 'text' as 'json'
      }
    ) as Observable<string>;
  }
}
