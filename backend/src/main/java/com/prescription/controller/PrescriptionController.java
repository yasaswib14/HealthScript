package com.prescription.controller;

import com.prescription.model.Prescription;
import com.prescription.service.PrescriptionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/prescriptions")
@Tag(name = "Prescription APIs")
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

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping
    public Prescription create(@RequestBody Prescription prescription) {
        return service.save(prescription);
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}")
    public Prescription update(@PathVariable Long id, @RequestBody Prescription prescription) {
        prescription.setId(id);
        return service.save(prescription);
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
