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
                    this.messages = data || [];
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

    // ✅ Respond to a patient's message
    respondToPatient(messageId: number, form: NgForm) {
        if (!form.valid) {
            alert('⚠️ Please enter both diagnosis and medication.');
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

        const payload = {
            diagnosis: form.value.diagnosis,
            medication: form.value.medication
        };

        this.http.post(`http://localhost:8081/doctor/respond/${messageId}`, payload, { headers })
            .subscribe({
                next: () => {
                    alert('✅ Prescription sent successfully!');
                    form.reset();
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
