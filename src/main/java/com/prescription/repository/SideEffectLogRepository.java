package com.prescription.repository;
import com.prescription.model.SideEffectLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SideEffectLogRepository extends JpaRepository<SideEffectLog, Long> {}
