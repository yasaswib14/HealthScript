package com.prescription.service;

import com.prescription.model.Prescription;
import com.prescription.repository.PrescriptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PrescriptionService {
    private final PrescriptionRepository repo;

    public PrescriptionService(PrescriptionRepository repo) {
        this.repo = repo;
    }

    public List<Prescription> getAll() { return repo.findAll(); }

    public Prescription getById(Long id) { return repo.findById(id).orElse(null); }

    public Prescription save(Prescription prescription) { return repo.save(prescription); }

    public void delete(Long id) { repo.deleteById(id); }
}
