package com.prescription.dto;

import java.time.LocalDate;

public class MedicationReminderDTO {
    private Long id;
    private MedicationDTO medication;
    private LocalDate date;
    private boolean taken;

    public MedicationReminderDTO() {}

    public MedicationReminderDTO(Long id, MedicationDTO medication, LocalDate date, boolean taken) {
        this.id = id;
        this.medication = medication;
        this.date = date;
        this.taken = taken;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MedicationDTO getMedication() {
        return medication;
    }

    public void setMedication(MedicationDTO medication) {
        this.medication = medication;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public boolean isTaken() {
        return taken;
    }

    public void setTaken(boolean taken) {
        this.taken = taken;
    }
}
