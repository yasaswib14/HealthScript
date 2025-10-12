package com.prescription.model;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class SideEffectLog {
    @Id @GeneratedValue
    private Long id;
    @ManyToOne
    private User patient;
    @ManyToOne
    private Medication medication;
    private String description;
    private String severity;
    private LocalDate dateLogged;
}
