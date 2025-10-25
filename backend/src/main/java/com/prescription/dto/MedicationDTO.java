package com.prescription.dto;

import java.time.LocalDate;

public class MedicationDTO {
    private Long id;
    private String medicationName;
    private String dosageTiming;
    private Integer durationDays;
    private LocalDate startDate;
    private LocalDate endDate;

    public MedicationDTO() {}

    public MedicationDTO(Long id, String medicationName, String dosageTiming, 
                        Integer durationDays, LocalDate startDate, LocalDate endDate) {
        this.id = id;
        this.medicationName = medicationName;
        this.dosageTiming = dosageTiming;
        this.durationDays = durationDays;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMedicationName() {
        return medicationName;
    }

    public void setMedicationName(String medicationName) {
        this.medicationName = medicationName;
    }

    public String getDosageTiming() {
        return dosageTiming;
    }

    public void setDosageTiming(String dosageTiming) {
        this.dosageTiming = dosageTiming;
    }

    public Integer getDurationDays() {
        return durationDays;
    }

    public void setDurationDays(Integer durationDays) {
        this.durationDays = durationDays;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}
