package com.prescription.model;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Medication {
    @Id @GeneratedValue
    private Long id;
    @ManyToOne
    private Prescription prescription;
    private String name;
    private String dosage;
    private String frequency;
    private LocalDate startDate;
    private LocalDate endDate;
}
