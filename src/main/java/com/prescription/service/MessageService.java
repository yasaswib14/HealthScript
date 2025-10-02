package com.prescription.service;

import com.prescription.model.Message;
import com.prescription.repository.MessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {
    private final MessageRepository repo;

    public MessageService(MessageRepository repo) {
        this.repo = repo;
    }

    public List<Message> getAll() { return repo.findAll(); }

    public Message getById(Long id) { return repo.findById(id).orElse(null); }

    public Message save(Message message) { return repo.save(message); }

    public void delete(Long id) { repo.deleteById(id); }
}
