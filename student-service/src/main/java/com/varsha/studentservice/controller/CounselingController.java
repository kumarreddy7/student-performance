package com.varsha.studentservice.controller;

import com.varsha.studentservice.entity.CounselingAppointment;
import com.varsha.studentservice.entity.Student;
import com.varsha.studentservice.repository.StudentRepository;
import com.varsha.studentservice.security.JwtUtil;
import com.varsha.studentservice.service.CounselingService;
import com.varsha.studentservice.exception.BadRequestException;
import com.varsha.studentservice.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/students/counseling")
public class CounselingController {

    @Autowired
    private CounselingService counselingService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private HttpServletRequest request;

    private String getEmailFromToken() {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String jwt = headerAuth.substring(7);
            return jwtUtil.getEmailFromJwtToken(jwt);
        }
        return null;
    }

    private String getUsernameFromToken() {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String jwt = headerAuth.substring(7);
            return jwtUtil.getUserNameFromJwtToken(jwt);
        }
        return null;
    }

    private String getRoleFromToken() {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String jwt = headerAuth.substring(7);
            return jwtUtil.getRoleFromJwtToken(jwt);
        }
        return null;
    }

    @GetMapping("/slots")
    public ResponseEntity<List<Map<String, Object>>> getSlots(
            @RequestParam("counselorUsername") String counselorUsername,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        String role = getRoleFromToken();
        if ("ROLE_STUDENT".equals(role)) {
            String email = getEmailFromToken();
            if (email == null) {
                throw new BadRequestException("Unauthorized access.");
            }
            Student student = studentRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for email: " + email));
            if (student.getCounselorUsername() == null || !student.getCounselorUsername().equalsIgnoreCase(counselorUsername)) {
                throw new BadRequestException("You can only access slots of your assigned counselor.");
            }
        }
        return ResponseEntity.ok(counselingService.getSlotsForDay(counselorUsername, date));
    }

    @PostMapping("/book")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<CounselingAppointment> bookAppointment(
            @RequestParam("counselorUsername") String counselorUsername,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam("timeSlot") String timeSlot) {
        
        String email = getEmailFromToken();
        if (email == null) {
            throw new BadRequestException("Unauthorized access.");
        }

        Student student = studentRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for email: " + email));

        if ("Deleted".equals(student.getStatus())) {
            throw new BadRequestException("Student account has been deactivated.");
        }

        if (student.getCounselorUsername() == null || !student.getCounselorUsername().equalsIgnoreCase(counselorUsername)) {
            throw new BadRequestException("You can only book appointments with your assigned counselor.");
        }

        String studentName = student.getFirstName() + " " + student.getLastName();
        return ResponseEntity.ok(counselingService.bookAppointment(
                student.getId(), studentName, counselorUsername, date, timeSlot
        ));
    }

    @PostMapping("/appointments/{id}/accept")
    @PreAuthorize("hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<Void> acceptAppointment(@PathVariable("id") Long id) {
        counselingService.acceptAppointment(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/appointments/{id}/reject")
    @PreAuthorize("hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<Void> rejectAppointment(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "No reason provided");
        counselingService.rejectAppointment(id, reason);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/off-day")
    @PreAuthorize("hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<Void> toggleOffDay(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam("isOff") boolean isOff) {
        String counselorUsername = getUsernameFromToken();
        if (counselorUsername == null) {
            throw new BadRequestException("Unauthorized access.");
        }
        counselingService.toggleOffDay(counselorUsername, date, isOff);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/off-day")
    public ResponseEntity<Map<String, Boolean>> checkOffDay(
            @RequestParam("counselorUsername") String counselorUsername,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        boolean isOff = counselingService.isCounselorOff(counselorUsername, date);
        Map<String, Boolean> result = new HashMap<>();
        result.put("isOff", isOff);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/appointments/student")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<CounselingAppointment>> getStudentAppointments() {
        String email = getEmailFromToken();
        if (email == null) {
            throw new BadRequestException("Unauthorized access.");
        }
        Student student = studentRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for email: " + email));
        
        return ResponseEntity.ok(counselingService.getStudentAppointments(student.getId()));
    }

    @GetMapping("/appointments/counselor")
    @PreAuthorize("hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<List<CounselingAppointment>> getCounselorAppointments() {
        String username = getUsernameFromToken();
        if (username == null) {
            throw new BadRequestException("Unauthorized access.");
        }
        return ResponseEntity.ok(counselingService.getCounselorAppointments(username));
    }

    @GetMapping("/appointments/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<List<CounselingAppointment>> getAllAppointments() {
        return ResponseEntity.ok(counselingService.getAllAppointments());
    }

    @GetMapping("/current-time")
    public ResponseEntity<Map<String, String>> getCurrentTime() {
        java.time.ZonedDateTime now = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
        Map<String, String> response = new HashMap<>();
        response.put("date", now.toLocalDate().toString());
        response.put("time", now.toLocalTime().toString().substring(0, 8)); // e.g. "11:28:17"
        response.put("timezone", "Asia/Kolkata");
        return ResponseEntity.ok(response);
    }
}

