package com.prescription.service;

import com.prescription.model.Medication;
import com.prescription.repository.MedicationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicationService {
    private final MedicationRepository repo;

    public MedicationService(MedicationRepository repo) {
        this.repo = repo;
    }

    public List<Medication> getAll() { return repo.findAll(); }

    public Medication getById(Long id) { return repo.findById(id).orElse(null); }

    public Medication save(Medication medication) { return repo.save(medication); }

    public void delete(Long id) { repo.deleteById(id); }
}
