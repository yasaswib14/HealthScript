package com.prescription.controller;

import com.prescription.model.Message;
import com.prescription.service.MessageService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/messages")
@Tag(name = "Message APIs")
public class MessageController {
    private final MessageService service;

    public MessageController(MessageService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @GetMapping
    public List<Message> getAll() {
        return service.getAll();
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @GetMapping("/{id}")
    public Message getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @PostMapping
    public Message create(@RequestBody Message message) {
        return service.save(message);
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @PutMapping("/{id}")
    public Message update(@PathVariable Long id, @RequestBody Message message) {
        message.setId(id);
        return service.save(message);
    }

    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
