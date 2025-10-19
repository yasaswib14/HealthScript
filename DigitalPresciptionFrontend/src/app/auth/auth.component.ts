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
    isRedirecting = false; // NEW flag to show blur + overlay

    constructor(private http: HttpClient, public router: Router) { }

    /**
     * ✅ Login and decode JWT to detect role
     */
    onLogin(form: NgForm) {
    if (form.valid) {
        const { username, password } = form.value;
        this.isRedirecting = true; // 👈 1. Start overlay

        this.http.post<{ token: string }>('http://localhost:8081/auth/login', { username, password })
            .subscribe({
                next: (response) => {
                    // REMOVE THE alert('Redirecting....'); LINE COMPLETELY!
                    localStorage.setItem('jwtToken', response.token);
                    
                    try {
                        const payload = JSON.parse(atob(response.token.split('.')[1]));
                        const roles = payload.roles;
                        const role = Array.isArray(roles) && roles[0]?.authority ? roles[0].authority : 'ROLE_UNKNOWN';
                        localStorage.setItem('userRole', role);

                        let redirectPath = '/';
                        if (role === 'ROLE_DOCTOR') {
                            redirectPath = '/doctor-dashboard';
                        } else if (role === 'ROLE_PATIENT') {
                            redirectPath = '/patient-dashboard';
                        }
                        
                        // 2. Navigate and remove overlay on completion
                        this.router.navigateByUrl(redirectPath).finally(() => {
                            this.isRedirecting = false;
                        });

                    } catch (e) {
                        console.error('Failed to decode JWT and determine role.', e);
                        alert('Login failed: Role could not be determined.');
                        this.isRedirecting = false; // 3. Stop overlay on JWT error
                        this.router.navigateByUrl('/');
                    }
                },
                error: (err) => {
                    // 4. Stop overlay and show error alert on authentication failure
                    this.isRedirecting = false; 
                    alert(err.error?.message || 'Invalid credentials. Please try again.');
                }
            });
    }
}

    /**
     * ✅ Register new user (Doctor or Patient)
     * Shows blur + "Redirecting..." then switches to the login view (no alerts)
     */
    // Inside AuthComponent.ts

onRegister(form: NgForm) {
    if (form.valid) {
        const { username, email, role, password, specialization } = form.value;

        // 1. Initiate API call
        this.http.post('http://localhost:8081/auth/register', {
            username,
            email,
            role,
            password,
            specialization
        }).subscribe({
            next: () => {
                // NO ALERT HERE! ✅

                // 2. Activate smooth redirection overlay
                this.isRedirecting = true;
                
                // 3. Pause briefly for visual effect, then navigate
                setTimeout(() => {
                    // Set showRegister to false to ensure the Login form is the target view
                    this.showRegister = false; 
                    
                    // Navigate to the base route ('/') or '/auth' to reload the login view silently
                    this.router.navigateByUrl('/login').finally(() => {
                        this.isRedirecting = false; // Deactivate overlay after navigation
                        form.reset(); 
                    });
                }, 900); // 900ms pause for smooth visual transition
            },
            error: (err) => {
                // 4. If registration fails, stop overlay and alert the user (critical feedback)
                this.isRedirecting = false;
                alert(err.error || 'Registration failed. Please try again.');
            }
        });
    }
}
}
