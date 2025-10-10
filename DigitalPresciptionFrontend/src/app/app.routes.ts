import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { PatientDashboardComponent } from './patient-dashboard/patient-dashboard.component';

export const routes: Routes = [
    // { path: '', component: AppComponent },                 // login/register
    { path: 'dashboard/patient', component: PatientDashboardComponent }, // dashboard after login
    { path: '**', redirectTo: '' }                         // fallback
];
