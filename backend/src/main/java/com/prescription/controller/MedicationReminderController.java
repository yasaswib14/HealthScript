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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    /**
     * GET /today
     *
     * For every medication of the authenticated patient:
     * - For each dayNumber from 1..durationDays compute dayDate = startDate +
     * (dayNumber-1)
     * - If dayDate <= today: ensure a MedicationReminder exists (create if missing)
     * with dayNumber
     * - Return the list of reminders for the patient covering days up to today
     *
     * NOTE: We intentionally do NOT create reminders for future dates (dayDate >
     * today).
     */

    @GetMapping("/today")
    public ResponseEntity<?> getTodayReminders(Authentication auth) {
        User patient = userRepository.findByUsername(auth.getName()).orElse(null);
        if (patient == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        LocalDate today = LocalDate.now();
        List<MedicationReminder> allReminders = new ArrayList<>();

        List<Medication> meds = medicationRepository.findByPatientId(patient.getId());

        for (Medication med : meds) {
            // Defensive: ensure startDate exists
            if (med.getStartDate() == null) {
                med.setStartDate(today);
            }

            int duration = Math.max(med.getDurationDays(), 1);

            for (int day = 1; day <= duration; day++) {
                LocalDate dayDate = med.getStartDate().plusDays(day - 1);

                // Try to find an existing reminder for that specific day
                List<MedicationReminder> existing = reminderRepository.findByMedicationAndDate(med, dayDate);
                MedicationReminder reminder;

                if (existing.isEmpty()) {
                    reminder = new MedicationReminder();
                    reminder.setMedication(med);
                    reminder.setPatient(patient);
                    reminder.setDate(dayDate);
                    reminder.setDayNumber(day);
                    reminder.setTaken(false); // future or new reminder is not taken
                    reminderRepository.save(reminder);
                } else {
                    reminder = existing.get(0);
                    // ensure dayNumber is set
                    if (reminder.getDayNumber() == 0) {
                        reminder.setDayNumber(day);
                        reminderRepository.save(reminder);
                    }
                }

                allReminders.add(reminder);
            }
        }

        return ResponseEntity.ok(allReminders);
    }

    /**
     * POST /{medicationId}/mark-taken
     *
     * Marks a reminder as taken for 'today' for the specified medication.
     * This keeps existing behavior. The controller will find today's
     * reminder and mark it taken (or create one and mark taken).
     *
     * If you later want to mark a specific day (not today), we can
     * accept a dayNumber or date parameter — but to avoid changing existing
     * behavior,
     * we keep this as-is for now.
     */
    @PostMapping("/{medicationId}/mark-taken")
    public ResponseEntity<?> markTaken(@PathVariable Long medicationId, Authentication auth) {
        User patient = userRepository.findByUsername(auth.getName()).orElse(null);
        if (patient == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<Medication> medicationOpt = medicationRepository.findById(medicationId);
        if (medicationOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Medication not found");
        }
        Medication medication = medicationOpt.get();

        LocalDate today = LocalDate.now();

        List<MedicationReminder> existing = reminderRepository.findByMedicationAndDate(medication, today);

        MedicationReminder reminder = existing.isEmpty() ? new MedicationReminder() : existing.get(0);
        reminder.setMedication(medication);
        reminder.setPatient(patient);
        reminder.setDate(today);

        // If medication has startDate + duration and today falls within it, set proper
        // dayNumber
        if (medication.getStartDate() != null && medication.getDurationDays() > 0) {
            long dayIndex = java.time.temporal.ChronoUnit.DAYS.between(medication.getStartDate(), today) + 1;
            if (dayIndex >= 1 && dayIndex <= medication.getDurationDays()) {
                reminder.setDayNumber((int) dayIndex);
            } else {
                // If today is outside the prescribed range, leave dayNumber as-is or set 0
                if (reminder.getDayNumber() == 0)
                    reminder.setDayNumber(0);
            }
        } else {
            // fallback to day 1 for single-day meds
            reminder.setDayNumber(1);
        }

        reminder.setTaken(true);
        reminderRepository.save(reminder);

        return ResponseEntity.ok("✅ Marked as taken for " + medication.getMedicationName());
    }

}
