package com.prescription.controller;
import com.prescription.model.User;
import com.prescription.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService service;
    public UserController(UserService service) { this.service = service; }

    @GetMapping public List<User> getAll() { return service.getAll(); }
    @GetMapping("/{id}") public User getById(@PathVariable Long id) { return service.getById(id); }
    @PostMapping public User create(@RequestBody User user) { return service.save(user); }
    @PutMapping("/{id}") public User update(@PathVariable Long id, @RequestBody User user) {
        user.setId(id); return service.save(user);
    }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { service.delete(id); }
}
