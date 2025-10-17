import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { PatientDashboardComponent } from './patient-dashboard/patient-dashboard.component';
import { DoctorDashboardComponent } from './doctor-dashboard/doctor-dashboard.component';
import { TodayRemindersComponent } from './medication-reminder/today-reminders/today-reminders.component';

export const routes: Routes = [
    { path: '', component: AuthComponent },
    { path: 'patient-dashboard', component: PatientDashboardComponent },
    { path: 'doctor-dashboard', component: DoctorDashboardComponent },
    { path: 'reminders', component: TodayRemindersComponent },
];
