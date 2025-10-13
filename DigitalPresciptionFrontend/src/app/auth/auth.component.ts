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
    encapsulation: ViewEncapsulation.None
})
export class AuthComponent {
    protected readonly title = signal('DigitalPrescriptionFrontend');
    showRegister = false;
    selectedRole = '';

    constructor(private http: HttpClient, public router: Router) { }

    /**
     * ✅ Login and decode JWT to detect role
     */
    onLogin(form: NgForm) {
        if (form.valid) {
            const username = form.value['username'];
            const password = form.value['password'];

            this.http.post<{ token: string }>('http://localhost:8081/auth/login', { username, password })
                .subscribe({
                    next: (response) => {
                        alert('Login successful!');
                        localStorage.setItem('jwtToken', response.token);

                        // Decode JWT payload (base64) to extract role
                        try {
                            const payload = JSON.parse(atob(response.token.split('.')[1]));
                            const roles = payload.roles;
                            const role = Array.isArray(roles) && roles[0]?.authority ? roles[0].authority : 'ROLE_UNKNOWN';
                            localStorage.setItem('userRole', role);

                            // 🔁 Redirect based on role
                            if (role === 'ROLE_DOCTOR') {
                                this.router.navigateByUrl('/doctor-dashboard');
                            } else if (role === 'ROLE_PATIENT') {
                                this.router.navigateByUrl('/patient-dashboard');
                            } else {
                                alert('Unknown role: ' + role);
                            }
                        } catch (e) {
                            console.error('Failed to decode JWT', e);
                            alert('Error decoding token.');
                        }
                    },
                    error: (err) => {
                        alert(err.error?.message || 'Invalid credentials. Please try again.');
                    }
                });
        }
    }

    /**
     * ✅ Register new user (Doctor or Patient)
     */
    onRegister(form: NgForm) {
        if (form.valid) {
            const { username, email, role, password, specialization } = form.value;

            this.http.post('http://localhost:8081/auth/register', {
                username,
                email,
                role,
                password,
                specialization
            }).subscribe({
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
