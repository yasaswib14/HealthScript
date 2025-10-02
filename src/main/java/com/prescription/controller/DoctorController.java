package com.prescription.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DoctorController {

    @PreAuthorize("hasRole('DOCTOR')")
    @GetMapping("/doctor/dashboard")
    public String doctorDashboard() {
        return "Welcome Doctor! This is your dashboard.";
    }
}
