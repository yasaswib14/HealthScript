import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TodayRemindersComponent } from '../medication-reminder/today-reminders/today-reminders.component';
import { MedicationReminderService } from '../services/medication-reminder.service';
import { MedicationReminder } from '../models/reminder.model';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule, TodayRemindersComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private reminderService = inject(MedicationReminderService);

  currentView: 'menu' | 'form' | 'prescriptions' | 'reminders' = 'menu';
  prescriptions: any[] = [];
  isLoading: boolean = false;
  selectedSpecialist: string = '';
  currentDate: Date = new Date();

  hasPendingReminderToday: boolean = false;
  hasActiveReminders: boolean = false;

  private authHeaders: HttpHeaders | null = null;

  private readonly STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    UPCOMING: 'upcoming'
  };

  private safeAlert(message: string): void {
    if (isPlatformBrowser(this.platformId)) {
      alert(message);
    } else {
      console.log(`ALERT (SSR-safe): ${message}`);
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('jwtToken');
    if (token) {
      this.authHeaders = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.loadPrescriptions(this.authHeaders);
      this.loadReminderSummary(this.authHeaders);
      this.reminderService.reminderUpdated$.subscribe(() => {
        this.loadReminderSummary(this.authHeaders!);
      });
    }

    setInterval(() => {
      this.currentDate = new Date();
      this.cdr.detectChanges();
    }, 60000);
  }

  private loadReminderSummary(headers: HttpHeaders): void {
    this.reminderService.getTodayReminders(headers).subscribe({
      next: (list: MedicationReminder[]) => {
        this.hasPendingReminderToday = Array.isArray(list) && list.some(r => !r.taken);
        this.hasActiveReminders = this.hasPendingReminderToday;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('⚠️ Failed to load reminder summary:', err);
      }
    });
  }

  private loadPrescriptions(headers: HttpHeaders): void {
    this.isLoading = true;
    this.http.get('http://localhost:8081/patient/prescriptions', { headers })
      .subscribe({
        next: (data: any) => {
          console.log('💊 Prescriptions fetched:', JSON.stringify(data, null, 2));
          this.prescriptions = (data || []).map((p: any) => ({
            ...p,
            doctor: {
              username: p.doctorName,
              specialization: p.doctorSpecialization
            },
            medications: p.medications || []
          }));

          // 🩺 Sort prescriptions after mapping (Active → Upcoming → Completed)
          this.prescriptions = this.getSortedPrescriptions(this.prescriptions);

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error fetching prescriptions:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onAgeChange(age: string, form: NgForm): void {
    const ageValue = parseInt(age, 10);
    const diseaseControl = form.controls['disease'];
    if (!diseaseControl) return;

    setTimeout(() => {
      if (!Number.isNaN(ageValue) && ageValue > 0 && ageValue < 10) {
        if (diseaseControl.value !== 'Pediatrician') {
          diseaseControl.setValue('Pediatrician');
          this.cdr.detectChanges();
        }
      } else if (ageValue >= 10 || Number.isNaN(ageValue)) {
        if (diseaseControl.value === 'Pediatrician') {
          diseaseControl.setValue('');
          this.cdr.detectChanges();
        }
      }
    }, 0);
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.safeAlert('⚠️ Please fill out all required fields.');
      return;
    }

    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('jwtToken') || '';
    }
    if (!token) {
      this.safeAlert('Unauthorized! Please log in again.');
      return;
    }

    const payload = {
      diseaseType: form.value.disease,
      content: form.value.description,
      severity: form.value.severity
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    this.http.post('http://localhost:8081/patient/submit-form', payload, { headers, responseType: 'text' })
      .subscribe({
        next: (res) => {
          console.log('✅ Form submitted:', res);
          this.safeAlert(res);
          form.reset();
          this.loadPrescriptions(headers);
          this.currentView = 'menu';
        },
        error: (err) => {
          console.error('❌ Error submitting form:', err);
          this.safeAlert('❌ Failed to send details. Please try again.');
        }
      });
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('jwtToken');
    }
    this.router.navigate(['/']);
  }

  // 🟢 Medication Helpers
  isActiveMedication(medication: any): boolean {
    const today = new Date();
    const startDate = new Date(medication.startDate);
    const endDate = new Date(medication.endDate);
    return startDate <= today && today <= endDate;
  }

  isMedicationCompleted(medication: any): boolean {
    const today = new Date();
    const endDate = new Date(medication.endDate);
    return today > endDate;
  }

  getMedicationStatus(medication: any): string {
    if (this.isMedicationCompleted(medication)) return 'Completed';
    if (this.isActiveMedication(medication)) return 'Active';
    return 'Upcoming';
  }

  getMedicationStatusIcon(medication: any): string {
    if (this.isMedicationCompleted(medication)) return 'fas fa-check-circle';
    if (this.isActiveMedication(medication)) return 'fas fa-capsules';
    return 'fas fa-clock';
  }

  getMedicationProgress(medication: any): number {
    const today = new Date();
    const startDate = new Date(medication.startDate);
    const endDate = new Date(medication.endDate);

    if (today < startDate) return 0;
    if (today > endDate) return 100;

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  }

  // ✅ Sort medications inside a prescription
  getSortedMedications(list: any[]): any[] {
    if (!Array.isArray(list)) return [];
    const active = list.filter(m => this.isActiveMedication(m));
    const upcoming = list.filter(m => !this.isActiveMedication(m) && !this.isMedicationCompleted(m));
    const completed = list.filter(m => this.isMedicationCompleted(m));

    active.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    completed.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    return [...active, ...upcoming, ...completed];
  }

  // ✅ Sort entire prescriptions: Active → Upcoming → Completed
  private getSortedPrescriptions(list: any[]): any[] {
    const isPrescriptionCompleted = (p: any): boolean =>
      p.medications && p.medications.every((m: any) => this.isMedicationCompleted(m));

    const active = list.filter(p => p.medications.some((m: any) => this.isActiveMedication(m)));
    const upcoming = list.filter(p => !p.medications.some((m: any) => this.isActiveMedication(m)) && !isPrescriptionCompleted(p));
    const completed = list.filter(p => isPrescriptionCompleted(p));

    return [...active, ...upcoming, ...completed];
  }
}
