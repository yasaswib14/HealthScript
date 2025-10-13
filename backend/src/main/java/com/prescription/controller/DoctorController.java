package com.prescription.controller;

import com.prescription.model.Message;
import com.prescription.model.Prescription;
import com.prescription.model.User;
import com.prescription.repository.MessageRepository;
import com.prescription.repository.PrescriptionRepository;
import com.prescription.repository.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/doctor")
@Tag(name = "Doctor APIs")
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

    // ✅ Dashboard test
    @GetMapping("/dashboard")
    public ResponseEntity<String> dashboard(Authentication authentication) {
        return ResponseEntity.ok("Welcome Doctor " + authentication.getName());
    }

    // ✅ Get all messages assigned to this doctor (filtered by specialization)
    @GetMapping("/messages")
    public ResponseEntity<?> getMessages(Authentication authentication) {
        String username = authentication.getName();
        System.out.println("DEBUG >>> Logged-in doctor username: " + username);

        User doctor = userRepository.findByUsername(username).orElse(null);
        if (doctor == null) {
            return ResponseEntity.badRequest().body("Doctor not found");
        }

        System.out.println("DEBUG >>> Doctor ID: " + doctor.getId());

        List<Message> messages = messageRepository.findByReceiver_Id(doctor.getId());
        System.out.println("DEBUG >>> Messages found: " + messages.size());

        return ResponseEntity.ok(messages);
    }

    // ✅ Doctor responds to patient with a prescription
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
        // prescription.setMessage(message);
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setMedication(request.getMedication());
        prescription.setIssuedAt(LocalDateTime.now());

        Prescription saved = prescriptionRepository.save(prescription);
        return ResponseEntity.ok(saved);
    }

    // ✅ DTO for prescription
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
