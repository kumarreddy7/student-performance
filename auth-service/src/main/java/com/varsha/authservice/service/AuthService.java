package com.varsha.authservice.service;

import com.varsha.authservice.dto.JwtResponse;
import com.varsha.authservice.dto.LoginRequest;
import com.varsha.authservice.dto.MessageResponse;
import com.varsha.authservice.dto.SignupRequest;
import com.varsha.authservice.entity.ERole;
import com.varsha.authservice.entity.Role;
import com.varsha.authservice.entity.User;
import com.varsha.authservice.exception.BadRequestException;
import com.varsha.authservice.exception.ResourceNotFoundException;
import com.varsha.authservice.repository.RoleRepository;
import com.varsha.authservice.repository.UserRepository;
import com.varsha.authservice.security.JwtUtil;
import com.varsha.authservice.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtil jwtUtil;

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtil.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(item -> item.getAuthority().replace("ROLE_", "").toLowerCase())
                .orElse(null);

        return new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                role);
    }

    @Transactional
    public MessageResponse registerUser(SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new BadRequestException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new BadRequestException("Error: Email is already in use!");
        }

        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());

        // Default password: first 3 chars of email + #123
        String password = signUpRequest.getPassword();
        if (password == null || password.trim().isEmpty()) {
            String emailPrefix = signUpRequest.getEmail();
            if (emailPrefix.length() >= 3) {
                emailPrefix = emailPrefix.substring(0, 3);
            }
            password = emailPrefix + "#123";
        }
        user.setPassword(encoder.encode(password));

        String strRole = signUpRequest.getRole();
        Role userRole;

        if (strRole == null) {
            userRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                    .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
        } else {
            switch (strRole.toLowerCase()) {
                case "admin":
                    userRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                            .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
                    break;
                case "teacher":
                    userRole = roleRepository.findByName(ERole.ROLE_TEACHER)
                            .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
                    break;
                case "counselor":
                    userRole = roleRepository.findByName(ERole.ROLE_COUNSELOR)
                            .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
                    break;
                case "principal":
                    userRole = roleRepository.findByName(ERole.ROLE_PRINCIPAL)
                            .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
                    break;
                case "hod":
                    userRole = roleRepository.findByName(ERole.ROLE_HOD)
                            .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
                    break;
                default:
                    userRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                            .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
            }
        }

        user.setRole(userRole);

        // Set branch and subjects for faculty/counselor
        if (signUpRequest.getBranch() != null && !signUpRequest.getBranch().trim().isEmpty()) {
            user.setBranch(signUpRequest.getBranch().trim());
        }
        if (signUpRequest.getSubjects() != null && !signUpRequest.getSubjects().trim().isEmpty()) {
            user.setSubjects(signUpRequest.getSubjects().trim());
        }

        user.setIsHod(false);

        userRepository.save(user);

        return new MessageResponse("User registered successfully!");
    }

    @Transactional
    public MessageResponse assignHod(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.getRole() == null || (user.getRole().getName() != ERole.ROLE_TEACHER && user.getRole().getName() != ERole.ROLE_HOD)) {
            throw new BadRequestException("Only faculty members can be assigned as HOD.");
        }

        if (user.getBranch() == null || user.getBranch().trim().isEmpty()) {
            throw new BadRequestException("This faculty member has no branch assigned. Please assign a branch first.");
        }

        // Demote the existing HOD of this branch
        List<User> existingHods = userRepository.findByBranchAndIsHodTrue(user.getBranch());
        for (User existingHod : existingHods) {
            existingHod.setIsHod(false);
            // Change role back to TEACHER
            Role teacherRole = roleRepository.findByName(ERole.ROLE_TEACHER)
                    .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
            existingHod.setRole(teacherRole);
            userRepository.save(existingHod);
        }

        // Promote this user to HOD
        user.setIsHod(true);
        Role hodRole = roleRepository.findByName(ERole.ROLE_HOD)
                .orElseThrow(() -> new ResourceNotFoundException("Error: HOD Role is not found."));
        user.setRole(hodRole);
        userRepository.save(user);

        return new MessageResponse("User assigned as HOD of " + user.getBranch() + " successfully!");
    }

    @Transactional
    public MessageResponse removeHod(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        user.setIsHod(false);
        Role teacherRole = roleRepository.findByName(ERole.ROLE_TEACHER)
                .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
        user.setRole(teacherRole);
        userRepository.save(user);

        return new MessageResponse("HOD designation removed. User is now a regular faculty member.");
    }

    @Transactional
    public void updatePassword(User user, String newPassword) {
        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void updateProfile(User user, String newEmail, String newPassword) {
        if (newEmail != null && !newEmail.trim().isEmpty()) {
            user.setEmail(newEmail);
        }
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            user.setPassword(encoder.encode(newPassword));
        }
        userRepository.save(user);
    }
}
