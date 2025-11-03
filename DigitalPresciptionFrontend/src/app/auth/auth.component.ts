import { Component, signal, ViewEncapsulation } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface LoginData {
    username: string;
    password: string;
}

interface RegisterData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
    specialization?: string;
}

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
    isRedirecting = false;

    // Form models
    loginData: LoginData = {
        username: '',
        password: ''
    };

    registerData: RegisterData = {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        specialization: ''
    };

    constructor(private http: HttpClient, public router: Router) { }

    // Form toggle with reset
    toggleForm() {
        this.showRegister = !this.showRegister;
        if (this.showRegister) {
            this.registerData = {
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: '',
                specialization: ''
            };
        } else {
            this.loginData = {
                username: '',
                password: ''
            };
        }
    }

    // Password validation method
    validatePassword(password: string | undefined): boolean {
        if (!password) return false;
        const minLength = 6;
        const hasLetter = /[A-Za-z]/.test(password);
        const hasNumber = /\d/.test(password);
        return password.length >= minLength && hasLetter && hasNumber;
    }

    // Confirm password validation
    passwordsMatch(): boolean {
        return Boolean(this.registerData.password) && 
               Boolean(this.registerData.confirmPassword) &&
               this.registerData.password === this.registerData.confirmPassword;
    }

    // Email validation
    validateEmail(email: string | undefined): boolean {
        if (!email) return false;
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailPattern.test(email);
    }

    // Login form validation
    validateLoginForm(): boolean {
        return Boolean(this.loginData.username) &&
               this.loginData.username.length >= 3 && 
               this.validatePassword(this.loginData.password);
    }

    // Register form validation
    validateRegisterForm(): boolean {
        const hasValidUsername = Boolean(this.registerData.username) && 
                               this.registerData.username.length >= 3;
        const hasValidEmail = this.validateEmail(this.registerData.email);
        const hasValidPassword = this.validatePassword(this.registerData.password);
        const hasValidRole = Boolean(this.registerData.role);
        
        // Specialization check only if doctor role is selected
        const needsSpecialization = this.registerData.role === 'ROLE_DOCTOR';
        const hasValidSpecialization = needsSpecialization ? 
            Boolean(this.registerData.specialization && this.registerData.specialization.trim()) : true;

        return hasValidUsername &&
               hasValidEmail &&
               hasValidPassword &&
               this.passwordsMatch() &&
               hasValidRole &&
               hasValidSpecialization;
    }

    /**
     * ✅ Login and decode JWT to detect role
     */
    onLogin(form: NgForm) {
        if (form.valid && this.validateLoginForm()) {
            const { username, password } = this.loginData;
            this.isRedirecting = true;

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
                    form.resetForm(); // Reset the form
                    this.loginData = { // Reset the login data
                        username: '',
                        password: ''
                    };
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
    if (form.valid && this.validateRegisterForm()) {
        const { username, email, role, password, specialization } = this.registerData;

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
