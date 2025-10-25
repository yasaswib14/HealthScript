package com.prescription.controller;

import com.prescription.model.Medication;
import com.prescription.model.MedicationReminder;
import com.prescription.model.User;
import com.prescription.dto.MedicationDTO;
import com.prescription.dto.MedicationReminderDTO;
import org.springframework.transaction.annotation.Transactional;
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
    @Transactional
    public ResponseEntity<List<MedicationReminderDTO>> getTodayReminders(Authentication auth) {
        User patient = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();
        List<MedicationReminder> allReminders = new ArrayList<>();

        List<Medication> meds = medicationRepository.findByPatientId(patient.getId());

        for (Medication med : meds) {
            // Defensive: ensure startDate exists
            if (med.getStartDate() == null) {
                med.setStartDate(today);
            }

            // Only get/create reminder for today
            List<MedicationReminder> existing = reminderRepository.findByMedicationAndDate(med, today);
            MedicationReminder reminder;

            if (existing.isEmpty() && !med.getStartDate().isAfter(today) && 
                (med.getEndDate() == null || !med.getEndDate().isBefore(today))) {
                reminder = new MedicationReminder();
                reminder.setMedication(med);
                reminder.setPatient(patient);
                reminder.setDate(today);
                reminder.setTaken(false);
                reminderRepository.save(reminder);
                allReminders.add(reminder);
            } else if (!existing.isEmpty()) {
                allReminders.add(existing.get(0));
            }
        }

        // Convert to DTOs to prevent circular references
        List<MedicationReminderDTO> reminderDTOs = allReminders.stream()
                .map(reminder -> new MedicationReminderDTO(
                    reminder.getId(),
                    new MedicationDTO(
                        reminder.getMedication().getId(),
                        reminder.getMedication().getMedicationName(),
                        reminder.getMedication().getDosageTiming(),
                        reminder.getMedication().getDurationDays(),
                        reminder.getMedication().getStartDate(),
                        reminder.getMedication().getEndDate()
                    ),
                    reminder.getDate(),
                    reminder.isTaken()
                ))
                .toList();
        
        return ResponseEntity.ok(reminderDTOs);
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
