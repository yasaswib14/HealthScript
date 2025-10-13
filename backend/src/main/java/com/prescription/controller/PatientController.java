package com.prescription.controller;

import com.prescription.model.Message;
import com.prescription.model.User;
import com.prescription.model.Prescription;
import com.prescription.repository.MessageRepository;
import com.prescription.repository.UserRepository;
import com.prescription.repository.PrescriptionRepository;
import com.prescription.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/patient")
@Tag(name = "Patient APIs")
public class PatientController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    public PatientController(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    // ✅ Patient Dashboard
    @GetMapping("/dashboard")
    public String dashboard(Authentication authentication) {
        String username = authentication.getName();
        return "Welcome to Patient Dashboard, " + username + "!";
    }

    /**
     * ✅ Patient submits a form with diseaseType & description.
     * Automatically routes to the doctor(s) of that specialization.
     */
    @PostMapping("/submit-form")
    public ResponseEntity<?> submitForm(@RequestBody MessageDto dto, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        // ✅ Get patient (sender)
        User sender = resolveUser(authentication);
        if (sender == null) {
            return ResponseEntity.badRequest().body("Invalid user session");
        }

        // ✅ Find all doctors with this specialization
        List<User> doctors = userRepository.findAllByRoleAndSpecialization("ROLE_DOCTOR", dto.getDiseaseType());

        if (doctors.isEmpty()) {
            return ResponseEntity.badRequest().body("No doctor found with specialization: " + dto.getDiseaseType());
        }

        // ✅ Create a message for each doctor
        List<Message> sentMessages = new ArrayList<>();
        for (User receiver : doctors) {
            Message message = new Message();
            message.setSender(sender);
            message.setReceiver(receiver);
            message.setContent(dto.getContent());
            message.setTimestamp(LocalDateTime.now());
            sentMessages.add(messageRepository.save(message));
        }

        return ResponseEntity
                .ok("✅ Sent to " + doctors.size() + " doctor(s) with specialization: " + dto.getDiseaseType());
    }

    /**
     * ✅ Fetch prescriptions created by doctors for this patient.
     */
    @GetMapping("/prescriptions")
    public ResponseEntity<List<Prescription>> getPrescriptionsForPatient(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();
        User patient = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        List<Prescription> prescriptions = prescriptionRepository.findByPatient(patient);
        return ResponseEntity.ok(prescriptions);
    }

    // ✅ Helper to extract User object from Authentication
    private User resolveUser(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return ((CustomUserDetails) principal).getUser();
        }
        return userRepository.findByUsername(authentication.getName()).orElse(null);
    }

    // ✅ DTO for Patient form submission
    public static class MessageDto {
        private String diseaseType;
        private String content;

        public String getDiseaseType() {
            return diseaseType;
        }

        public void setDiseaseType(String diseaseType) {
            this.diseaseType = diseaseType;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
