import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent {
  onSubmit(form: NgForm) {
    if (form.valid) {
      console.log('Patient form submitted:', form.value);
      alert('✅ Patient details submitted successfully!');
      form.reset();
    } else {
      alert('⚠️ Please fill out all required fields.');
    }
  }
}
