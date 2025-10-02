package com.prescription.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/patient")
public class PatientController {

    @GetMapping("/dashboard")
    public String dashboard(Authentication authentication) {
        String username = authentication.getName();
        return "Welcome to Patient Dashboard, " + username + "!";
    }
}
