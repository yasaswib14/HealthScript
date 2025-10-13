package com.prescription.repository;

import com.prescription.model.MedicationReminder;
import com.prescription.model.Medication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MedicationReminderRepository extends JpaRepository<MedicationReminder, Long> {
    List<MedicationReminder> findByPatientId(Long patientId);

    List<MedicationReminder> findByMedicationAndDate(Medication medication, LocalDate date);
}
