package com.prescription.controller;

import com.prescription.model.Message;
import com.prescription.model.User;
import com.prescription.repository.MessageRepository;
import com.prescription.repository.UserRepository;
import com.prescription.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/patient")
public class PatientController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public PatientController(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/dashboard")
    public String dashboard(Authentication authentication) {
        String username = authentication.getName();
        return "Welcome to Patient Dashboard, " + username + "!";
    }

    /**
     * Accept a patient submission and persist it as a Message.
     * Example POST body:
     * {
     * "content": "I have headache and fever",
     * "receiverId": 2
     * }
     *
     * receiverId is optional (you may set it to a doctor's user id later).
     */
    @PostMapping("/submit-form")
    public ResponseEntity<?> submitForm(@RequestBody MessageDto dto, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        // Resolve sender User
        Object principal = authentication.getPrincipal();
        User sender = null;

        if (principal instanceof CustomUserDetails) {
            sender = ((CustomUserDetails) principal).getUser();
        } else {
            // fallback: try to lookup by username
            String username = authentication.getName();
            Optional<User> optUser = userRepository.findByUsername(username);
            if (optUser.isPresent()) {
                sender = optUser.get();
            }
        }

        if (sender == null) {
            return ResponseEntity.status(400).body("Could not resolve sender user");
        }

        // Build Message
        Message message = new Message();
        message.setSender(sender);
        message.setContent(dto.getContent());
        message.setTimestamp(LocalDateTime.now());

        // If receiverId provided, try to set receiver
        if (dto.getReceiverId() != null) {
            Optional<User> optReceiver = userRepository.findById(dto.getReceiverId());
            optReceiver.ifPresent(message::setReceiver);
        }

        Message saved = messageRepository.save(message);

        return ResponseEntity.ok(saved);
    }

    // DTO for incoming JSON
    public static class MessageDto {
        private String content;
        private Long receiverId; // optional; doctor id (set later from frontend)

        public MessageDto() {
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public Long getReceiverId() {
            return receiverId;
        }

        public void setReceiverId(Long receiverId) {
            this.receiverId = receiverId;
        }
    }
}
