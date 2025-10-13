package com.prescription.repository;

import com.prescription.model.Prescription;
import com.prescription.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatient(User patient);
}
