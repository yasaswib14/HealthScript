import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
    selector: 'app-doctor-dashboard',
    standalone: true,
    imports: [CommonModule, HttpClientModule, FormsModule],
    templateUrl: './doctor-dashboard.component.html',
    styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {

    apiMessage: string = '';
    messages: any[] = [];
    isLoading: boolean = true;
    medications: any[] = [];
    diagnosis: string = '';

    showSuccess: boolean = false;
    showError: boolean = false;
    messageText: string = '';

    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { 
        // Initialize with one empty medication
        this.addMedication();
    }

    addMedication() {
        this.medications.push({
            medicationName: '',
            dosageTiming: '',
            durationDays: 1,
            startDate: new Date().toISOString().split('T')[0]
        });
    }

    removeMedication(index: number) {
        this.medications.splice(index, 1);
        if (this.medications.length === 0) {
            this.addMedication(); // Always keep at least one medication
        }
    }

    ngOnInit(): void {
        // ✅ Skip SSR phase and wait for client hydration
        if (typeof window === 'undefined') {
            console.warn('Running on SSR, skipping init...');
            return;
        }

        // ✅ Delay ensures hydration & localStorage ready
        setTimeout(() => {
            const token = localStorage.getItem('jwtToken');
            const role = localStorage.getItem('userRole');

            if (!token || role !== 'ROLE_DOCTOR') {
                console.warn('Unauthorized access! Redirecting...');
                alert('Unauthorized access!');
                this.router.navigateByUrl('/');
                return;
            }

            const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

            // ✅ Fetch doctor dashboard greeting
            this.http.get('http://localhost:8081/doctor/dashboard', { headers, responseType: 'text' })
                .subscribe({
                    next: (res) => this.apiMessage = res,
                    error: () => this.apiMessage = 'Backend unreachable or unauthorized'
                });

            // ✅ Fetch assigned patient messages
            this.fetchMessages(headers);
        }, 300);
    }

    

    private fetchMessages(headers: HttpHeaders) {
        this.isLoading = true;

        this.http.get('http://localhost:8081/doctor/messages', { headers })
            .subscribe({
                next: (data: any) => {
                    console.log('✅ Messages received from backend:', data);
                    const severityOrder: { [key: string]: number } = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                    this.messages = (data || []).sort((a: any, b: any) => {
                        const sevA = severityOrder[a.severity] || 0;
                        const sevB = severityOrder[b.severity] || 0;
                        return sevB - sevA; // Descending order (HIGH first)
                    });
                    this.isLoading = false;

                    // ✅ Force UI repaint for hydration-safe change detection
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('❌ Error fetching messages:', err);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
    }

    // ✅ Respond to a patient's message (now includes multiple medications)
    respondToPatient(messageId: number, form: NgForm) {
        if (this.isFormInvalid(form)) {
            this.showError = true;
            this.messageText = 'Please fill in all required fields for medications';
            setTimeout(() => {
                this.showError = false;
                this.messageText = '';
            }, 3000);
            return;
        }

        const token = localStorage.getItem('jwtToken');
        if (!token) {
            this.showError = true;
            this.messageText = 'Please log in again';
            setTimeout(() => {
                this.router.navigateByUrl('/auth');
            }, 2000);
            return;
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        const payload = {
            diagnosis: this.diagnosis,
            medications: this.medications.map(med => ({
                medicationName: med.medicationName,
                dosageTiming: med.dosageTiming,
                durationDays: +med.durationDays, // ensure it's a number
                startDate: med.startDate
            }))
        };

        this.http.post(`http://localhost:8081/doctor/respond/${messageId}`, payload, { headers })
            .subscribe({
                next: () => {
                    this.showSuccess = true;
                    this.messageText = '✅ Prescription sent successfully!';
                    setTimeout(() => {
                        this.showSuccess = false;
                        this.messageText = '';
                    }, 3000);

                    // Reset form and medications
                    this.diagnosis = '';
                    this.medications = [{
                        medicationName: '',
                        dosageTiming: '',
                        durationDays: 1,
                        startDate: new Date().toISOString().split('T')[0]
                    }];
                    form.reset();

                    // Update messages list
                    this.messages = this.messages.filter(msg => msg.id !== messageId);
                    const authToken = localStorage.getItem('jwtToken') || '';
                    const hdrs = new HttpHeaders({ 'Authorization': `Bearer ${authToken}` });
                    this.fetchMessages(hdrs);
                },
                error: (err) => {
                    console.error('❌ Error sending prescription:', err);
                    this.showError = true;
                    this.messageText = '❌ Failed to send prescription: ' + 
                        (err.error?.message || err.statusText || 'Unknown error');
                    setTimeout(() => {
                        this.showError = false;
                        this.messageText = '';
                    }, 5000);
                }
            });
    }

    isFormInvalid(form: NgForm): boolean {
        if (form.invalid || this.medications.length === 0) {
            return true;
        }
        
        return this.medications.some(med => {
            return !med.medicationName || 
                   !med.dosageTiming || 
                   !med.durationDays || 
                   med.durationDays < 1;
        });
    }

    logout(): void {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userRole');
        }
        this.router.navigateByUrl('/');
    }
}
