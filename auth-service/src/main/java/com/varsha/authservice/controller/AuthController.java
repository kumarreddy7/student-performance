package com.varsha.authservice.controller;

import com.varsha.authservice.dto.JwtResponse;
import com.varsha.authservice.dto.LoginRequest;
import com.varsha.authservice.dto.MessageResponse;
import com.varsha.authservice.dto.SignupRequest;
import com.varsha.authservice.dto.UserResponse;
import com.varsha.authservice.service.AuthService;
import com.varsha.authservice.repository.UserRepository;
import com.varsha.authservice.entity.ERole;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.varsha.authservice.security.JwtUtil jwtUtil;

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

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getRole() != null ? user.getRole().getName().name().replace("ROLE_", "").toLowerCase() : "student"
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/counselors")
    public ResponseEntity<List<UserResponse>> getCounselors() {
        List<UserResponse> counselors = userRepository.findAll().stream()
                .filter(user -> user.getRole() != null && user.getRole().getName() == ERole.ROLE_COUNSELOR)
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        "counselor"
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(counselors);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable("id") Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(new MessageResponse("User account deleted successfully."));
    }

    @PutMapping("/users/{id}/reset-password")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<MessageResponse> resetPassword(@PathVariable("id") Long id, @RequestBody Map<String, String> body) {
        String newPassword = body.get("password");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("New password cannot be empty."));
        }
        
        com.varsha.authservice.entity.User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        authService.updatePassword(user, newPassword);
        return ResponseEntity.ok(new MessageResponse("Password reset successfully."));
    }

    @PutMapping("/profile")
    public ResponseEntity<MessageResponse> updateProfile(@RequestBody Map<String, String> body, jakarta.servlet.http.HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (headerAuth == null || !headerAuth.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(new MessageResponse("Unauthorized access."));
        }
        String jwt = headerAuth.substring(7);
        String username = jwtUtil.getUserNameFromJwtToken(jwt);
        if (username == null) {
            return ResponseEntity.status(401).body(new MessageResponse("Invalid token."));
        }
        
        com.varsha.authservice.entity.User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String newEmail = body.get("email");
        if (newEmail != null && !newEmail.trim().isEmpty() && !newEmail.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
            }
        }
        
        String newPassword = body.get("password");
        authService.updateProfile(user, newEmail, newPassword);
        
        return ResponseEntity.ok(new MessageResponse("Profile updated successfully."));
    }
}


