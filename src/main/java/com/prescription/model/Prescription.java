package com.prescription.model;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Prescription {
    @Id @GeneratedValue
    private Long id;
    @ManyToOne
    private User doctor;
    @ManyToOne
    private User patient;
    private String diagnosis;
    private LocalDate issuedDate;
}
