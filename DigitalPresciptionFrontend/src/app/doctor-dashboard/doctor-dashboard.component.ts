import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
    selector: 'app-doctor-dashboard',
    standalone: true,
    imports: [CommonModule, HttpClientModule],
    templateUrl: './doctor-dashboard.component.html',
    styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {

    username: string = '';
    message: string = '';
    apiMessage: string = '';

    constructor(private http: HttpClient, private router: Router) { }

    ngOnInit(): void {
        // Extract username from role or placeholder
        const token = localStorage.getItem('jwtToken');
        const role = localStorage.getItem('userRole');

        if (!token || role !== 'ROLE_DOCTOR') {
            alert('Unauthorized access!');
            this.router.navigateByUrl('/');
            return;
        }

        this.message = 'Welcome to Doctor Dashboard!';

        // ✅ Optional: Fetch backend confirmation (doctor/dashboard endpoint)
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
        this.http.get('http://localhost:8081/doctor/dashboard', { headers, responseType: 'text' })
            .subscribe({
                next: (res) => this.apiMessage = res,
                error: (err) => this.apiMessage = 'Backend unreachable or unauthorized'
            });
    }

    logout(): void {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        this.router.navigateByUrl('/');
    }
}
