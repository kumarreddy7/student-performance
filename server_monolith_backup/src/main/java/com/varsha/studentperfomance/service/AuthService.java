package com.varsha.studentperfomance.service;

import com.varsha.studentperfomance.dto.JwtResponse;
import com.varsha.studentperfomance.dto.LoginRequest;
import com.varsha.studentperfomance.dto.MessageResponse;
import com.varsha.studentperfomance.dto.SignupRequest;
import com.varsha.studentperfomance.entity.ERole;
import com.varsha.studentperfomance.entity.Role;
import com.varsha.studentperfomance.entity.User;
import com.varsha.studentperfomance.exception.BadRequestException;
import com.varsha.studentperfomance.exception.ResourceNotFoundException;
import com.varsha.studentperfomance.repository.RoleRepository;
import com.varsha.studentperfomance.repository.UserRepository;
import com.varsha.studentperfomance.security.JwtUtil;
import com.varsha.studentperfomance.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                .map(item -> item.getAuthority())
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
        user.setPassword(encoder.encode(signUpRequest.getPassword()));

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
                default:
                    userRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                            .orElseThrow(() -> new ResourceNotFoundException("Error: Role is not found."));
            }
        }

        user.setRole(userRole);
        userRepository.save(user);

        return new MessageResponse("User registered successfully!");
    }
}
