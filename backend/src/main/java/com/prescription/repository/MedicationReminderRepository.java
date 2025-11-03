package com.prescription.repository;

import com.prescription.model.MedicationReminder;
import com.prescription.model.Medication;
import com.prescription.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface MedicationReminderRepository extends JpaRepository<MedicationReminder, Long> {

    // ✅ Fetch all reminders for a specific patient
    List<MedicationReminder> findByPatientId(Long patientId);

    // ✅ Fetch reminders for a specific patient on a specific date
    List<MedicationReminder> findByPatientAndDate(User patient, LocalDate date);

    // ✅ Fetch reminder for specific medication on a specific day
    List<MedicationReminder> findByMedicationAndDate(Medication medication, LocalDate date);

    // ✅ Optional: Bulk reset (useful for scheduler)
    @Transactional
    @Modifying
    @Query("UPDATE MedicationReminder r SET r.taken = false, r.date = :today WHERE r.date < :today")
    int resetOldReminders(LocalDate today);
}
