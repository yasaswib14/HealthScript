import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TodayRemindersComponent } from '../medication-reminder/today-reminders/today-reminders.component';

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

  // Initialized to 'menu' to show the three feature cards
  currentView: 'menu' | 'form' | 'prescriptions' | 'reminders' = 'menu'; 

  prescriptions: any[] = [];
  isLoading: boolean = false;
  selectedSpecialist: string = '';
  currentDate: Date = new Date();
  hasActiveReminders: boolean = false;

  // Status constants
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
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      // Load prescriptions data even if we start on the 'menu' view
      this.loadPrescriptions(headers); 
    }

    // Start interval to update currentDate every minute
    setInterval(() => {
      this.currentDate = new Date();
      this.cdr.detectChanges();
    }, 60000); // Update every minute
  }

  private loadPrescriptions(headers: HttpHeaders): void {
    this.isLoading = true;
    this.http.get('http://localhost:8081/patient/prescriptions', { headers })
      .subscribe({
        next: (data: any) => {
          console.log('💊 Prescriptions fetched:', JSON.stringify(data, null, 2));
          // Transform the data to match our template's expectations
          this.prescriptions = (data || []).map((p: any) => ({
            ...p,
            doctor: {
              username: p.doctorName, // Backend sends doctorName instead of doctor object
              specialization: p.doctorSpecialization // If available in the response
            },
            medications: p.medications || []
          }));
          this.updateMedicationStatus(); // Update active reminders status
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
 
        // Use setTimeout to ensure the form model is fully updated before we manipulate it.
        setTimeout(() => {
            // 1. Check for age less than 10
            if (!Number.isNaN(ageValue) && ageValue > 0 && ageValue < 10) {
               
                if (diseaseControl.value !== 'Pediatrician') {
                    // Force set the value
                    diseaseControl.setValue('Pediatrician');
                    this.cdr.detectChanges();
                }
               
            } else if (ageValue >= 10 || Number.isNaN(ageValue)) {
               
                // 2. If age is 10 or more, or cleared, and it was auto-selected, reset it.
                if (diseaseControl.value === 'Pediatrician') {
                    // Reset the selection
                    diseaseControl.setValue('');
                    this.cdr.detectChanges();
                }
            }
        }, 0); // Zero timeout guarantees immediate execution after current cycle
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
      'Authorization': `Bearer ${token}`
    });

    this.http.post('http://localhost:8081/patient/submit-form', payload, { headers, responseType: 'text' })
      .subscribe({
        next: (res) => {
          console.log('✅ Form submitted:', res);
          this.safeAlert(res);
          form.reset();
          this.loadPrescriptions(headers);
          // Switch back to menu after submission
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
    this.router.navigate(['/']); // Redirect to login
  }

  /**
   * Check if a medication is currently active
   */
  isActiveMedication(medication: any): boolean {
    const today = new Date();
    const startDate = new Date(medication.startDate);
    const endDate = new Date(medication.endDate);
    return startDate <= today && today <= endDate;
  }

  /**
   * Check if a medication course is completed
   */
  isMedicationCompleted(medication: any): boolean {
    const today = new Date();
    const endDate = new Date(medication.endDate);
    return today > endDate;
  }

  /**
   * Get the current status of a medication
   */
  getMedicationStatus(medication: any): string {
    if (this.isMedicationCompleted(medication)) {
      return 'Completed';
    }
    if (this.isActiveMedication(medication)) {
      return 'Active';
    }
    return 'Upcoming';
  }

  /**
   * Get appropriate icon class for medication status
   */
  getMedicationStatusIcon(medication: any): string {
    if (this.isMedicationCompleted(medication)) {
      return 'fas fa-check-circle';
    }
    if (this.isActiveMedication(medication)) {
      return 'fas fa-capsules';
    }
    return 'fas fa-clock';
  }

  /**
   * Calculate the progress percentage of a medication course
   */
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

  /**
   * Update medication active status when loading prescriptions
   */
  private updateMedicationStatus(): void {
    this.hasActiveReminders = this.prescriptions.some(prescription => 
      prescription.medications?.some((med: any) => this.isActiveMedication(med))
    );
  }
}