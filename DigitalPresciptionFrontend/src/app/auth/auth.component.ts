import { Component, signal, ViewEncapsulation } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [RouterOutlet, FormsModule, HttpClientModule, CommonModule],
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.css'],
    encapsulation: ViewEncapsulation.None  // 👈 This line ensures styles actually apply
})
export class AuthComponent {
    protected readonly title = signal('DigitalPrescriptionFrontend');
    showRegister = false;
    selectedRole = '';

    constructor(private http: HttpClient, public router: Router) { }

    onLogin(form: NgForm) {
        if (form.valid) {
            const username = form.value['username'];
            const password = form.value['password'];

            this.http.post('http://localhost:8081/auth/login', { username, password })
                .subscribe({
                    next: () => {
                        alert('Login successful!');
                        this.router.navigateByUrl('/dashboard/patient');
                    },
                    error: (err) => {
                        alert(err.error || 'Invalid credentials. Please try again.');
                    }
                });
        }
    }

    onRegister(form: NgForm) {
        if (form.valid) {
            const { username, email, role, password, specialization } = form.value;
            this.http.post('http://localhost:8081/auth/register', { username, email, role, password, specialization })
                .subscribe({
                    next: () => {
                        alert('Registration successful! You can now log in.');
                        this.showRegister = false;
                    },
                    error: (err) => {
                        alert(err.error || 'Registration failed. Please try again.');
                    }
                });
        }
    }
}
