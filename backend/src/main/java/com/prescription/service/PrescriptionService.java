package com.prescription.service;

import com.prescription.model.Medication;
import com.prescription.model.Prescription;
import com.prescription.repository.MedicationRepository;
import com.prescription.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PrescriptionService {
    private final PrescriptionRepository prescriptionRepo;
    private final MedicationRepository medicationRepo;

    public PrescriptionService(PrescriptionRepository prescriptionRepo, MedicationRepository medicationRepo) {
        this.prescriptionRepo = prescriptionRepo;
        this.medicationRepo = medicationRepo;
    }

    public List<Prescription> getAll() { 
        return prescriptionRepo.findAll(); 
    }

    public Prescription getById(Long id) { 
        return prescriptionRepo.findById(id).orElse(null); 
    }

    @Transactional
    public Prescription save(Prescription prescription) {
        // Save the prescription first
        Prescription savedPrescription = prescriptionRepo.save(prescription);
        
        // Set the prescription reference and save each medication
        prescription.getMedications().forEach(medication -> {
            medication.setPrescription(savedPrescription);
            medicationRepo.save(medication);
        });
        
        return savedPrescription;
    }

    @Transactional
    public void delete(Long id) { 
        Prescription prescription = prescriptionRepo.findById(id).orElse(null);
        if (prescription != null) {
            // Delete associated medications first
            prescription.getMedications().forEach(medicationRepo::delete);
            // Then delete the prescription
            prescriptionRepo.delete(prescription);
        }
    }
}
