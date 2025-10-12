package com.prescription.service;

import com.prescription.model.SideEffectLog;
import com.prescription.repository.SideEffectLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SideEffectLogService {
    private final SideEffectLogRepository repo;

    public SideEffectLogService(SideEffectLogRepository repo) {
        this.repo = repo;
    }

    public List<SideEffectLog> getAll() { return repo.findAll(); }

    public SideEffectLog getById(Long id) { return repo.findById(id).orElse(null); }

    public SideEffectLog save(SideEffectLog log) { return repo.save(log); }

    public void delete(Long id) { repo.deleteById(id); }
}
