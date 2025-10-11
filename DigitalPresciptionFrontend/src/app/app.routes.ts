import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { PatientDashboardComponent } from './patient-dashboard/patient-dashboard.component';
// ✅ new import

export const routes: Routes = [
    { path: '', component: AuthComponent }, // ✅ root login/register page

    // ✅ Patient dashboard route (existing, unchanged)
    { path: 'dashboard/patient', component: PatientDashboardComponent },



    // ✅ Fallback to root for unknown routes
    { path: '**', redirectTo: '' }
];
