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
  // 🌐 Injected Services
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private reminderService = inject(MedicationReminderService);

  // 🧭 View Management
  currentView: 'menu' | 'form' | 'prescriptions' | 'reminders' = 'menu';

  // 💊 Prescription Data
  prescriptions: any[] = [];
  isLoading: boolean = false;
  selectedSpecialist: string = '';
  currentDate: Date = new Date();

  // 🕒 Reminder State
  hasPendingReminderToday: boolean = false;
  hasActiveReminders: boolean = false; // backward compatibility with template

  // 🔐 Auth Header Cache
  private authHeaders: HttpHeaders | null = null;

  // 🔤 Medication Status Enum
  private readonly STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    UPCOMING: 'upcoming'
  };

  // ⚠️ Safe alert for both SSR and browser
  private safeAlert(message: string): void {
    if (isPlatformBrowser(this.platformId)) {
      alert(message);
    } else {
      console.log(`ALERT (SSR-safe): ${message}`);
    }
  }

  // 🚀 OnInit Lifecycle
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('jwtToken');
    if (token) {
      this.authHeaders = new HttpHeaders({ Authorization: `Bearer ${token}` });

      // Load prescriptions and reminders
      this.loadPrescriptions(this.authHeaders);
      this.loadReminderSummary(this.authHeaders);

      // 🔔 Auto-refresh reminder status when updated elsewhere
      this.reminderService.reminderUpdated$.subscribe(() => {
        this.loadReminderSummary(this.authHeaders!);
      });
    }

    // ⏰ Auto-update time every minute
    setInterval(() => {
      this.currentDate = new Date();
      this.cdr.detectChanges();
    }, 60000);
  }

  // 📆 Fetch whether there are any reminders pending today
  private loadReminderSummary(headers: HttpHeaders): void {
    this.reminderService.getTodayReminders(headers).subscribe({
      next: (list: MedicationReminder[]) => {
        this.hasPendingReminderToday = Array.isArray(list) && list.some(r => !r.taken);
        this.hasActiveReminders = this.hasPendingReminderToday; // sync with template
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('⚠️ Failed to load reminder summary:', err);
      }
    });
  }

  // 💊 Load Prescription Data
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

  // 👶 Auto-select Pediatrician for age under 10
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

  // 📝 Submit Disease Form
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

  // 🚪 Logout Function
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
}
