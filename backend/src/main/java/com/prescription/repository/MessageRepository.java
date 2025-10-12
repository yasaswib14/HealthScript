package com.prescription.repository;

import com.prescription.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByReceiver_Id(Long receiverId); // fetch messages for doctor
}
