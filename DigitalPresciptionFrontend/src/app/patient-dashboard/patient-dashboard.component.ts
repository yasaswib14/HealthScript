import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent {

  onSubmit(form: NgForm) {
    if (form.valid) {
      console.log('Form data:', form.value);
      alert('Patient form submitted successfully!');
      form.reset();
    } else {
      alert('Please fill all required fields!');
    }
  }
}
