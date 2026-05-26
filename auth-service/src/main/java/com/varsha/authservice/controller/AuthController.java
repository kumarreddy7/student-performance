package com.varsha.authservice.controller;

import com.varsha.authservice.dto.JwtResponse;
import com.varsha.authservice.dto.LoginRequest;
import com.varsha.authservice.dto.MessageResponse;
import com.varsha.authservice.dto.SignupRequest;
import com.varsha.authservice.service.AuthService;
import com.varsha.authservice.repository.UserRepository;
import com.varsha.authservice.entity.ERole;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.authenticateUser(loginRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        return ResponseEntity.ok(authService.registerUser(signUpRequest));
    }

    @GetMapping("/users/count")
    public ResponseEntity<Map<String, Long>> getUserCounts() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("teachers", userRepository.countByRoleName(ERole.ROLE_TEACHER));
        counts.put("counselors", userRepository.countByRoleName(ERole.ROLE_COUNSELOR));
        counts.put("students", userRepository.countByRoleName(ERole.ROLE_STUDENT));
        return ResponseEntity.ok(counts);
    }
}
