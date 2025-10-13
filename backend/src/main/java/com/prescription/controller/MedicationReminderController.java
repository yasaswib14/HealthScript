package com.prescription.controller;

import com.prescription.model.Medication;
import com.prescription.model.MedicationReminder;
import com.prescription.model.User;
import com.prescription.repository.MedicationRepository;
import com.prescription.repository.MedicationReminderRepository;
import com.prescription.repository.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/patient/reminder")
@Tag(name = "Medication Reminder APIs")
public class MedicationReminderController {

    @Autowired
    private MedicationRepository medicationRepository;

    @Autowired
    private MedicationReminderRepository reminderRepository;

    @Autowired
    private UserRepository userRepository;

    // ✅ Get all reminders for today's date
    @GetMapping("/today")
    public ResponseEntity<?> getTodayReminders(Authentication auth) {
        User patient = userRepository.findByUsername(auth.getName()).orElse(null);
        if (patient == null)
            return ResponseEntity.status(401).body("Unauthorized");

        LocalDate today = LocalDate.now();
        List<MedicationReminder> reminders = new ArrayList<>();

        List<Medication> meds = medicationRepository.findAll(); // assuming linked with prescriptions
        for (Medication med : meds) {
            if (med.getPatient().getId().equals(patient.getId())) {
                List<MedicationReminder> existing = reminderRepository.findByMedicationAndDate(med, today);
                if (existing.isEmpty()) {
                    MedicationReminder reminder = new MedicationReminder();
                    reminder.setMedication(med);
                    reminder.setPatient(patient);
                    reminder.setDate(today);
                    reminder.setTaken(false);
                    reminderRepository.save(reminder);
                    reminders.add(reminder);
                } else {
                    reminders.addAll(existing);
                }
            }
        }
        return ResponseEntity.ok(reminders);
    }

    // ✅ Mark as taken for today
    @PostMapping("/{medicationId}/mark-taken")
    public ResponseEntity<?> markTaken(@PathVariable Long medicationId, Authentication auth) {
        User patient = userRepository.findByUsername(auth.getName()).orElse(null);
        if (patient == null)
            return ResponseEntity.status(401).body("Unauthorized");

        Medication medication = medicationRepository.findById(medicationId).orElse(null);
        if (medication == null)
            return ResponseEntity.badRequest().body("Medication not found");

        LocalDate today = LocalDate.now();
        List<MedicationReminder> existing = reminderRepository.findByMedicationAndDate(medication, today);

        MedicationReminder reminder = existing.isEmpty() ? new MedicationReminder() : existing.get(0);
        reminder.setMedication(medication);
        reminder.setPatient(patient);
        reminder.setDate(today);
        reminder.setTaken(true);
        reminderRepository.save(reminder);

        return ResponseEntity.ok("✅ Marked as taken for " + medication.getMedicationName());
    }
}
