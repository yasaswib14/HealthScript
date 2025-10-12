package com.prescription.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User doctor;

    @ManyToOne
    private User patient;

    @OneToOne
    private Message message; // Link to the patient’s message

    private String medication; // what the doctor prescribes
    private String diagnosis; // optional, doctor’s note
    private LocalDateTime issuedAt;
}
