package com.prescription.controller;

import com.prescription.model.Medication;
import com.prescription.model.Prescription;
import com.prescription.model.User;
import com.prescription.service.PrescriptionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.prescription.security.CustomUserDetails;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/prescriptions")
@Tag(name = "Prescription APIs")
@SecurityRequirement(name = "bearerAuth")
public class PrescriptionController {
    private final PrescriptionService service;

    public PrescriptionController(PrescriptionService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @GetMapping
    public List<Prescription> getAll() {
        return service.getAll();
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @GetMapping("/{id}")
    public Prescription getById(@PathVariable Long id) {
        return service.getById(id);
    }

    public static class PrescriptionRequest {
        private String diagnosis;
        private List<MedicationRequest> medications;

        // Getters and Setters
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public List<MedicationRequest> getMedications() { return medications; }
        public void setMedications(List<MedicationRequest> medications) { this.medications = medications; }
    }

    public static class MedicationRequest {
        private String medicationName;
        private String dosageTiming;
        private int durationDays;
        private LocalDate startDate;

        // Getters and Setters
        public String getMedicationName() { return medicationName; }
        public void setMedicationName(String medicationName) { this.medicationName = medicationName; }
        public String getDosageTiming() { return dosageTiming; }
        public void setDosageTiming(String dosageTiming) { this.dosageTiming = dosageTiming; }
        public int getDurationDays() { return durationDays; }
        public void setDurationDays(int durationDays) { this.durationDays = durationDays; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping
    public Prescription create(@RequestBody PrescriptionRequest request, Authentication auth) {
        User doctor = ((CustomUserDetails) auth.getPrincipal()).getUser();
        
        Prescription prescription = new Prescription();
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setDoctor(doctor);
        
        for (MedicationRequest medRequest : request.getMedications()) {
            Medication medication = new Medication();
            medication.setMedicationName(medRequest.getMedicationName());
            medication.setDosageTiming(medRequest.getDosageTiming());
            medication.setDurationDays(medRequest.getDurationDays());
            medication.setStartDate(medRequest.getStartDate());
            medication.setPatient(prescription.getPatient());
            prescription.addMedication(medication);
        }

        return service.save(prescription);
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}")
    public Prescription update(@PathVariable Long id, @RequestBody PrescriptionRequest request) {
        Prescription prescription = service.getById(id);
        if (prescription != null) {
            prescription.setDiagnosis(request.getDiagnosis());
            
            // Clear existing medications
            prescription.getMedications().clear();
            
            // Add new medications
            for (MedicationRequest medRequest : request.getMedications()) {
                Medication medication = new Medication();
                medication.setMedicationName(medRequest.getMedicationName());
                medication.setDosageTiming(medRequest.getDosageTiming());
                medication.setDurationDays(medRequest.getDurationDays());
                medication.setStartDate(medRequest.getStartDate());
                medication.setPatient(prescription.getPatient());
                prescription.addMedication(medication);
            }
            
            return service.save(prescription);
        }
        return null;
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
