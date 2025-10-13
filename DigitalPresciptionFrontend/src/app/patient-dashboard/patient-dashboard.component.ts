import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  prescriptions: any[] = [];
  isLoading: boolean = false;

  // ✅ Safe alert for SSR (avoids `window.alert` crash)
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
      this.loadPrescriptions(headers);
    }
  }

  // ✅ Fetch prescriptions for the logged-in patient
  private loadPrescriptions(headers: HttpHeaders): void {
    this.isLoading = true;
    this.http.get('http://localhost:8081/patient/prescriptions', { headers })
      .subscribe({
        next: (data: any) => {
          console.log('💊 Prescriptions fetched:', data);
          this.prescriptions = data || [];
          this.isLoading = false;
          this.cdr.detectChanges(); // Force re-render
        },
        error: (err) => {
          console.error('❌ Error fetching prescriptions:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ✅ Handle form submission
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
      content: form.value.description
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

          // ✅ Reload prescriptions after sending form
          this.loadPrescriptions(headers);
        },
        error: (err) => {
          console.error('❌ Error submitting form:', err);
          this.safeAlert('❌ Failed to send details. Please try again.');
        }
      });
  }
}
