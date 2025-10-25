package com.prescription.controller;

import com.prescription.model.Message;
import com.prescription.model.User;
import com.prescription.model.Prescription;
import com.prescription.model.Medication;
import com.prescription.repository.MessageRepository;
import com.prescription.repository.UserRepository;
import com.prescription.repository.PrescriptionRepository;
import com.prescription.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
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
        // List<Message> sentMessages = new ArrayList<>();
        // for (User receiver : doctors) {
        //     Message message = new Message();
        //     message.setSender(sender);
        //     message.setReceiver(receiver);
        //     message.setContent(dto.getContent());
        //     message.setTimestamp(LocalDateTime.now());
        //     message.setSeverity(dto.getSeverity());
        //     sentMessages.add(messageRepository.save(message));
        // }

        // return ResponseEntity
        //         .ok("✅ Sent to " + doctors.size() + " doctor(s) with specialization: " + dto.getDiseaseType());
        User designatedReceiver = doctors.get(0); // Pick the first doctor as the mandatory 'receiver' placeholder

        Message message = new Message();
        message.setSender(sender);
        // Set the receiver to the first doctor found (mandatory foreign key), 
        // but this field is IGNORED by the fetching logic in DoctorController.
        message.setReceiver(designatedReceiver); 
        message.setContent(dto.getContent());
        message.setTimestamp(LocalDateTime.now());
        message.setSeverity(dto.getSeverity());
        
        messageRepository.save(message);
        // 🔑 CHANGE END

        return ResponseEntity
                .ok("✅ Patient request created and routed to the " + dto.getDiseaseType() + " doctor pool (" + doctors.size() + " doctors).");
    }

    /**
     * ✅ Fetch prescriptions created by doctors for this patient.
     */
    @GetMapping("/prescriptions")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PrescriptionDTO>> getPrescriptionsForPatient(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();
        User patient = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        List<Prescription> prescriptions = prescriptionRepository.findByPatient(patient);
        List<PrescriptionDTO> prescriptionDTOs = prescriptions.stream()
                .map(p -> new PrescriptionDTO(p))
                .toList();
        return ResponseEntity.ok(prescriptionDTOs);
    }

    // DTO to avoid circular references in JSON serialization
    public static class PrescriptionDTO {
        private Long id;
        private String doctorName;
        private String diagnosis;
        private LocalDateTime issuedAt;
        private List<MedicationDTO> medications;

        public PrescriptionDTO(Prescription prescription) {
            this.id = prescription.getId();
            this.doctorName = prescription.getDoctor().getUsername();
            this.diagnosis = prescription.getDiagnosis();
            this.issuedAt = prescription.getIssuedAt();
            this.medications = prescription.getMedications().stream()
                .map(m -> new MedicationDTO(m))
                .toList();
        }

        // Getters
        public Long getId() { return id; }
        public String getDoctorName() { return doctorName; }
        public String getDiagnosis() { return diagnosis; }
        public LocalDateTime getIssuedAt() { return issuedAt; }
        public List<MedicationDTO> getMedications() { return medications; }
    }

    public static class MedicationDTO {
        private Long id;
        private String medicationName;
        private String dosageTiming;
        private int durationDays;
        private LocalDate startDate;
        private LocalDate endDate;

        public MedicationDTO(Medication medication) {
            this.id = medication.getId();
            this.medicationName = medication.getMedicationName();
            this.dosageTiming = medication.getDosageTiming();
            this.durationDays = medication.getDurationDays();
            this.startDate = medication.getStartDate();
            this.endDate = medication.getEndDate();
        }

        // Getters
        public Long getId() { return id; }
        public String getMedicationName() { return medicationName; }
        public String getDosageTiming() { return dosageTiming; }
        public int getDurationDays() { return durationDays; }
        public LocalDate getStartDate() { return startDate; }
        public LocalDate getEndDate() { return endDate; }
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
        private String severity;
 
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
        public String getSeverity() {
            return severity;
        }
 
        public void setSeverity(String severity) {
            this.severity = severity;
        }
    }
}