import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MedicationReminder } from '../models/reminder.model'; 

@Injectable({
  providedIn: 'root'
})
export class MedicationReminderService {
  private API_PATH = 'http://localhost:8081/patient/reminder'; 

  constructor(private http: HttpClient) { }

  getTodayReminders(headers?: HttpHeaders): Observable<MedicationReminder[]> {
    return this.http.get<MedicationReminder[]>(`${this.API_PATH}/today`, { headers });
  }

  markTaken(medicationId: number, headers?: HttpHeaders): Observable<string> {
    // CRITICAL FIX: Add { responseType: 'text' } to correctly handle the String response
    // from your Spring Boot controller (ResponseEntity.ok("..."))
    return this.http.post(
      `${this.API_PATH}/${medicationId}/mark-taken`, 
      {}, 
      { headers, responseType: 'text' as 'json' } // <-- FIX HERE
    ) as Observable<string>;
  }
}
