package com.prescription.controller;

import com.prescription.model.Medication;
import com.prescription.service.MedicationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/medications")
@Tag(name = "Medication APIs")
@SecurityRequirement(name = "bearerAuth")
public class MedicationController {
    private final MedicationService service;

    public MedicationController(MedicationService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @GetMapping
    public List<Medication> getAll() {
        return service.getAll();
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @GetMapping("/{id}")
    public Medication getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping
    public Medication create(@RequestBody Medication medication) {
        return service.save(medication);
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}")
    public Medication update(@PathVariable Long id, @RequestBody Medication medication) {
        medication.setId(id);
        return service.save(medication);
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
