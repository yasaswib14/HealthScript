package com.prescription.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Message {
    @Id
    @GeneratedValue
    private Long id;
    @ManyToOne
    private User sender;
    @ManyToOne
    private User receiver;
    private String content;
    private LocalDateTime timestamp;
}
