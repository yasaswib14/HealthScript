package com.prescription.controller;

import com.prescription.model.Message;
import com.prescription.model.Prescription;
import com.prescription.model.User;
import com.prescription.model.Medication;
import com.prescription.repository.MessageRepository;
import com.prescription.repository.PrescriptionRepository;
import com.prescription.repository.UserRepository;
import com.prescription.repository.MedicationRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Comparator;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/doctor")
@Tag(name = "Doctor APIs")
public class DoctorController {

    private final MessageRepository messageRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;
    private final MedicationRepository medicationRepository;

    // Constructor injection (keeps consistent style)
    public DoctorController(MessageRepository messageRepository,
            PrescriptionRepository prescriptionRepository,
            UserRepository userRepository,
            MedicationRepository medicationRepository) {
        this.messageRepository = messageRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.userRepository = userRepository;
        this.medicationRepository = medicationRepository;
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

        // System.out.println("DEBUG >>> Doctor ID: " + doctor.getId());
        String doctorSpecialization = doctor.getSpecialization();
    
    if (doctorSpecialization == null || doctorSpecialization.isEmpty()) {
         return ResponseEntity.badRequest().body("Doctor specialization is not set.");
    }

        // List<Message> messages = messageRepository.findByReceiver_Id(doctor.getId());
        List<Message> messages = messageRepository.findByIsResolvedFalseAndReceiver_Specialization(doctorSpecialization);
        System.out.println("DEBUG >>> Messages found: " + messages.size());
        messages.sort(Comparator
            .comparing((Message m) -> {
                String severity = m.getSeverity() != null ? m.getSeverity().toUpperCase() : "LOW";
               
                int priority;
               
                // --- Replaced switch expression with traditional switch statement ---
                switch (severity) {
                    case "HIGH":
                        priority = 3;
                        break;
                    case "MEDIUM":
                        priority = 2;
                        break;
                    default: // LOW or null
                        priority = 1;
                        break;
                }
                // ------------------------------------------------------------------
               
                return priority;
            })
            .reversed() // Sort descending (3, 2, 1)
            .thenComparing(Message::getTimestamp) // Then sort by timestamp for secondary ordering
        );
 
        return ResponseEntity.ok(messages);
    }

    /**
     * Doctor responds to patient with a prescription.
     *
     * Now accepts additional medication scheduling fields:
     * - dosageTiming (String, e.g. "Morning, Night")
     * - durationDays (int)
     *
     * Will save:
     * - Prescription (existing behavior)
     * - Medication (new): links the prescription and patient and stores schedule
     * info
     */
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

        // create and save prescription
        Prescription prescription = new Prescription();
        prescription.setDoctor(doctor);
        prescription.setPatient(message.getSender());
        // If your Prescription entity has a message field comment/uncomment as needed:
        // prescription.setMessage(message);
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setMedication(request.getMedication());
        prescription.setIssuedAt(LocalDateTime.now());

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        // Create and save Medication record for reminders (if medication info provided)
        try {
            String medName = request.getMedication();
            String dosageTiming = request.getDosageTiming(); // may be null
            int durationDays = request.getDurationDays() <= 0 ? 0 : request.getDurationDays();

            // Only create Medication entity if medication name provided
            if (medName != null && !medName.trim().isEmpty()) {
                Medication med = new Medication();
                med.setPrescription(savedPrescription);
                med.setPatient(message.getSender());
                med.setMedicationName(medName);
                med.setDosageTiming(dosageTiming != null ? dosageTiming : "");
                med.setDurationDays(durationDays);

                LocalDate start = LocalDate.now();
                med.setStartDate(start);
                // If durationDays is zero or negative, we can set endDate = start (single day)
                // or null.
                med.setEndDate(durationDays > 0 ? start.plusDays(durationDays) : start);

                medicationRepository.save(med);
            }
        } catch (Exception ex) {
            // Non-fatal: medication creation failure should not break prescription save
            System.err.println("WARNING: failed to create Medication entry: " + ex.getMessage());
        }
        message.setResolved(true); 
        messageRepository.save(message);
        return ResponseEntity.ok(savedPrescription);
    }

    // ✅ DTO for prescription (extended)
    public static class PrescriptionRequest {
        private String diagnosis;
        private String medication;
        private String dosageTiming; // optional, e.g. "Morning, Night"
        private int durationDays; // optional

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

        public String getDosageTiming() {
            return dosageTiming;
        }

        public void setDosageTiming(String dosageTiming) {
            this.dosageTiming = dosageTiming;
        }

        public int getDurationDays() {
            return durationDays;
        }

        public void setDurationDays(int durationDays) {
            this.durationDays = durationDays;
        }
    }
}
