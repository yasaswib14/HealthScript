package com.prescription.repository;

import com.prescription.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findFirstByRoleAndSpecialization(String role, String specialization);

    // ✅ NEW: for sending to all doctors of a specialization
    List<User> findAllByRoleAndSpecialization(String role, String specialization);
}
