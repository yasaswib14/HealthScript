package com.prescription.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MedicationReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "medication_id")
    private Medication medication;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private User patient;

    // Existing fields
    private LocalDate date;
    private boolean taken;

    // ✅ NEW FIELD: Represents which "day" in the medication course this reminder
    // belongs to (e.g., 1, 2, 3...)
    private int dayNumber;

    // Convenience method (optional)
    public boolean isForToday() {
        return date != null && date.equals(LocalDate.now());
    }
}
