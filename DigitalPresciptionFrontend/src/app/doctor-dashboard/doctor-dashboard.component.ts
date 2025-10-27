import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

interface PrescriptionData {
    diagnosis: string;
    medications: Array<{
        medicationName: string;
        dosageTiming: string;
        durationDays: number;
        startDate: string;
    }>;
}

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
    prescriptionDataMap: Map<number, PrescriptionData> = new Map();
    formSubmitted: { [key: number]: boolean } = {};

    showSuccess: boolean = false;
    showError: boolean = false;
    messageText: string = '';

    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    addMedication(messageId: number) {
        const prescriptionData = this.getPrescriptionData(messageId);
        prescriptionData.medications.push({
            medicationName: '',
            dosageTiming: '',
            durationDays: 1,
            startDate: new Date().toISOString().split('T')[0]
        });
        this.prescriptionDataMap.set(messageId, prescriptionData);
    }

    removeMedication(messageId: number, index: number) {
        const prescriptionData = this.getPrescriptionData(messageId);
        prescriptionData.medications.splice(index, 1);
        if (prescriptionData.medications.length === 0) {
            this.addMedication(messageId); // Always keep at least one medication
        }
        this.prescriptionDataMap.set(messageId, prescriptionData);
    }

    getPrescriptionData(messageId: number): PrescriptionData {
        if (!this.prescriptionDataMap.has(messageId)) {
            this.prescriptionDataMap.set(messageId, {
                diagnosis: '',
                medications: [{
                    medicationName: '',
                    dosageTiming: '',
                    durationDays: 1,
                    startDate: new Date().toISOString().split('T')[0]
                }]
            });
        }
        return this.prescriptionDataMap.get(messageId)!;
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
    validateAndSubmit(messageId: number, form: NgForm) {
        // Mark the form as submitted
        this.formSubmitted[messageId] = true;
        
        // Get prescription data
        const prescriptionData = this.getPrescriptionData(messageId);
        
        // Mark all fields as touched to trigger validation
        Object.values(form.controls).forEach(control => {
            control.markAsTouched();
            control.updateValueAndValidity();
        });
        
        // Check for missing diagnosis
        if (!prescriptionData.diagnosis || prescriptionData.diagnosis.trim() === '') {
            this.showError = true;
            this.messageText = '⚠️ Please enter a diagnosis for the patient';
            
            // Scroll to the diagnosis field
            const diagnosisField = document.getElementById('diagnosis-' + messageId);
            if (diagnosisField) {
                diagnosisField.focus();
                diagnosisField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            setTimeout(() => {
                this.showError = false;
                this.messageText = '';
            }, 3000);
            return;
        }
        
        // If validation passes, submit the form
        this.respondToPatient(messageId, form);
    }

    respondToPatient(messageId: number, form: NgForm) {
        const prescriptionData = this.getPrescriptionData(messageId);

        // Then validate the rest of the form
        if (this.isFormInvalid(messageId, form)) {
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
            diagnosis: prescriptionData.diagnosis,
            medications: prescriptionData.medications.map(med => ({
                medicationName: med.medicationName,
                dosageTiming: med.dosageTiming,
                durationDays: +med.durationDays,
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

                    // Reset form and submission state for this specific message
                    this.prescriptionDataMap.delete(messageId);
                    this.formSubmitted[messageId] = false;
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

    isFormInvalid(messageId: number, form: NgForm): boolean {
        const prescriptionData = this.getPrescriptionData(messageId);
        
        // Check if form is invalid or if there are no medications
        if (form.invalid || prescriptionData.medications.length === 0) {
            return true;
        }
        
        // Check if diagnosis is empty or contains only whitespace
        if (!prescriptionData.diagnosis || prescriptionData.diagnosis.trim() === '') {
            this.showError = true;
            this.messageText = 'Please enter a diagnosis';
            setTimeout(() => {
                this.showError = false;
                this.messageText = '';
            }, 3000);
            return true;
        }
        
        // Check if all medications are properly filled
        return prescriptionData.medications.some(med => {
            return !med.medicationName || 
                   !med.dosageTiming || 
                   !med.durationDays || 
                   med.durationDays < 1;
        });
    }

    getTodayDate(): string {
        return new Date().toISOString().split('T')[0];
    }

    logout(): void {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userRole');
        }
        this.router.navigateByUrl('/');
    }
}
