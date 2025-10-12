package com.prescription.controller;

import com.prescription.model.Message;
import com.prescription.model.Prescription;
import com.prescription.model.User;
import com.prescription.repository.MessageRepository;
import com.prescription.repository.PrescriptionRepository;
import com.prescription.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/doctor")
public class DoctorController {

    private final MessageRepository messageRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;

    public DoctorController(MessageRepository messageRepository,
            PrescriptionRepository prescriptionRepository,
            UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.userRepository = userRepository;
    }

    // ✅ Simple test dashboard (keep this for confirmation)
    @GetMapping("/dashboard")
    public ResponseEntity<String> dashboard(Authentication authentication) {
        System.out.println("DEBUG >>> Authenticated user: " + authentication.getName());
        System.out.println("DEBUG >>> Authorities: " + authentication.getAuthorities());
        return ResponseEntity.ok("Welcome Doctor " + authentication.getName());
    }

    // ✅ View all messages for the logged-in doctor
    @GetMapping("/messages")
    public ResponseEntity<?> getMessages(Authentication authentication) {
        String username = authentication.getName();
        User doctor = userRepository.findByUsername(username).orElse(null);

        if (doctor == null) {
            return ResponseEntity.badRequest().body("Doctor not found");
        }

        List<Message> messages = messageRepository.findByReceiver_Id(doctor.getId());
        return ResponseEntity.ok(messages);
    }

    // ✅ Respond to a patient's message
    @PostMapping("/respond/{messageId}")
    public ResponseEntity<?> respondToMessage(
            @PathVariable Long messageId,
            @RequestBody PrescriptionRequest request,
            Authentication authentication) {

        Optional<Message> msgOpt = messageRepository.findById(messageId);
        if (msgOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Message not found");
        }

        Message message = msgOpt.get();
        String username = authentication.getName();
        User doctor = userRepository.findByUsername(username).orElse(null);

        if (doctor == null) {
            return ResponseEntity.badRequest().body("Doctor not found");
        }

        Prescription prescription = new Prescription();
        prescription.setDoctor(doctor);
        prescription.setPatient(message.getSender());
        prescription.setMessage(message);
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setMedication(request.getMedication());
        prescription.setIssuedAt(LocalDateTime.now());

        Prescription saved = prescriptionRepository.save(prescription);
        return ResponseEntity.ok(saved);
    }

    // Inner DTO class
    public static class PrescriptionRequest {
        private String diagnosis;
        private String medication;

        public String getDiagnosis() {
            return diagnosis;
        }

        public void setDiagnosis(String diagnosis) {
            this.diagnosis = diagnosis;
        }

        public String getMedication() {
            return medication;
        }

        public void setMedication(String medication) {
            this.medication = medication;
        }
    }
}
// updated one