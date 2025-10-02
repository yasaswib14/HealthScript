package com.prescription.controller;

import com.prescription.model.SideEffectLog;
import com.prescription.service.SideEffectLogService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/side-effects")
public class SideEffectLogController {
    private final SideEffectLogService service;

    public SideEffectLogController(SideEffectLogService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @GetMapping
    public List<SideEffectLog> getAll() { return service.getAll(); }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @GetMapping("/{id}")
    public SideEffectLog getById(@PathVariable Long id) { return service.getById(id); }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping
    public SideEffectLog create(@RequestBody SideEffectLog log) { return service.save(log); }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/{id}")
    public SideEffectLog update(@PathVariable Long id, @RequestBody SideEffectLog log) {
        log.setId(id);
        return service.save(log);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { service.delete(id); }
}
