import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MedicationReminder } from '../models/reminder.model';

@Injectable({
  providedIn: 'root'
})
export class MedicationReminderService {
  private readonly API_PATH = 'http://localhost:8081/patient/reminder';

  constructor(private http: HttpClient) { }

  /**
   * ✅ Fetches today's medication reminders for the logged-in patient.
   */
  getTodayReminders(headers?: HttpHeaders): Observable<MedicationReminder[]> {
    return this.http.get<MedicationReminder[]>(`${this.API_PATH}/today`, {
      headers
    });
  }

  /**
   * ✅ Marks a specific medication as taken for the current day.
   * 
   * Uses POST /patient/reminder/{medicationId}/mark-taken
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
        responseType: 'text' as 'json' // ensures backend's plain string is handled properly
      }
    ) as Observable<string>;
  }

  /**
   * ♻️ Optional utility: Manually resets daily reminders.
   * (Only used for testing; matches backend /reset-daily endpoint)
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
