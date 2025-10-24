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

    showSuccess: boolean = false;
    showError: boolean = false;
    messageText: string = '';

    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

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

    // ✅ Respond to a patient's message (now includes dosageTiming & durationDays)
    respondToPatient(messageId: number, form: NgForm) {
        if (!form.valid) {
            alert('⚠️ Please fill out required fields (diagnosis & medication).');
            return;
        }

        const token = localStorage.getItem('jwtToken');
        if (!token) {
            alert('Unauthorized. Please log in again.');
            this.router.navigateByUrl('/');
            return;
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        // read and sanitize optional fields
        const dosageTiming = form.value.dosageTiming || '';
        // durationDays may come as string from form control; make integer (0 if blank/NaN)
        const durationDays = form.value.durationDays ? Number(form.value.durationDays) : 0;

        const payload = {
            diagnosis: form.value.diagnosis,
            medication: form.value.medication,
            dosageTiming: dosageTiming,
            durationDays: Number.isNaN(durationDays) ? 0 : durationDays
        };

        this.http.post(`http://localhost:8081/doctor/respond/${messageId}`, payload, { headers })
            .subscribe({
                next: () => {
                    alert('✅ Prescription sent successfully!');
                    form.reset();

                    this.messages = this.messages.filter(msg => msg.id !== messageId);
                    // optionally refresh messages to reflect state
                    const authToken = localStorage.getItem('jwtToken') || '';
                    const hdrs = new HttpHeaders({ 'Authorization': `Bearer ${authToken}` });
                    this.fetchMessages(hdrs);
                },
                error: (err) => {
                    console.error('❌ Error sending prescription:', err);
                    alert('❌ Failed to send prescription.');
                }
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
