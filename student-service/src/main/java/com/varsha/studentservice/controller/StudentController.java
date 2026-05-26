package com.varsha.studentservice.controller;

import com.varsha.studentservice.client.AuthServiceClient;
import com.varsha.studentservice.dto.*;
import com.varsha.studentservice.entity.*;
import com.varsha.studentservice.repository.*;
import com.varsha.studentservice.security.JwtUtil;
import com.varsha.studentservice.service.StudentService;
import com.varsha.studentservice.service.AttendanceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RankingRepository rankingRepository;

    @Autowired
    private MarkRepository markRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private CsvUploadRepository csvUploadRepository;

    @Autowired
    private AssignmentMarkRepository assignmentMarkRepository;

    @Autowired
    private AuthServiceClient authServiceClient;

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

    private String getRoleFromToken() {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String jwt = headerAuth.substring(7);
            return jwtUtil.getRoleFromJwtToken(jwt);
        }
        return null;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<List<StudentDTO>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<Page<StudentDTO>> getStudentsPaged(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "search", defaultValue = "") String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        return ResponseEntity.ok(studentService.getStudentsPaged(search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<StudentDTO> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<StudentDTO> createStudent(@Valid @RequestBody StudentDTO studentDTO) {
        return new ResponseEntity<>(studentService.createStudent(studentDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<StudentDTO> updateStudent(@PathVariable Long id, @Valid @RequestBody StudentDTO studentDTO) {
        return ResponseEntity.ok(studentService.updateStudent(id, studentDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/interventions")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<InterventionDTO> addIntervention(@PathVariable Long id, @Valid @RequestBody InterventionDTO interventionDTO) {
        return new ResponseEntity<>(studentService.addIntervention(id, interventionDTO), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/interventions")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<List<InterventionDTO>> getInterventions(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getInterventionsForStudent(id));
    }

    @GetMapping("/{id}/assignments")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR') or hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<AssignmentMark>> getAssignments(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentMarkRepository.findByStudentId(id));
    }

    @PostMapping("/{id}/assignments")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<AssignmentMark> saveAssignment(@PathVariable Long id, @RequestBody AssignmentMark assignmentMark) {
        assignmentMark.setStudentId(id);
        return new ResponseEntity<>(assignmentMarkRepository.save(assignmentMark), HttpStatus.CREATED);
    }

    @PostMapping("/attendance")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<Void> saveAttendance(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody List<AttendanceDTO> attendanceList) {
        attendanceService.saveAttendance(date, attendanceList);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/attendance")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<List<AttendanceRecordDTO>> getAttendance(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getAttendanceByDate(date));
    }

    @GetMapping("/attendance/stats")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<AttendanceStatsDTO> getAttendanceStats(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getAttendanceStats(date));
    }

    @GetMapping("/rankings")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR') or hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<StudentRankingDTO>> getRankings() {
        String role = getRoleFromToken();
        String selfEmail = getEmailFromToken();
        
        Optional<Student> selfStudentOpt = Optional.empty();
        if ("ROLE_STUDENT".equals(role) && selfEmail != null) {
            selfStudentOpt = studentRepository.findByEmail(selfEmail);
        }

        final Optional<Student> selfStudent = selfStudentOpt;
        List<Ranking> rankings = rankingRepository.findAllByOrderByRankAsc();
        
        List<StudentRankingDTO> result = new ArrayList<>();
        for (Ranking ranking : rankings) {
            Optional<Student> studentOpt = studentRepository.findById(ranking.getStudentId());
            if (!studentOpt.isPresent() || "Deleted".equals(studentOpt.get().getStatus())) {
                continue;
            }
            Student student = studentOpt.get();
            StudentRankingDTO dto = new StudentRankingDTO();
            dto.setStudentId(student.getId());
            dto.setRank(ranking.getRank());
            dto.setClassName(student.getClassName());
            dto.setSection(student.getSection());

            boolean isSelf = selfStudent.isPresent() && student.getId().equals(selfStudent.get().getId());
            dto.setIsSelf(isSelf);

            if ("ROLE_STUDENT".equals(role)) {
                if (isSelf) {
                    dto.setFirstName(student.getFirstName());
                    dto.setLastName(student.getLastName());
                    dto.setEmail(student.getEmail());
                    dto.setRollNumber(student.getRollNumber());
                    dto.setTotalMarks(ranking.getTotalMarks());
                    dto.setPercentage(ranking.getPercentage());
                } else {
                    dto.setFirstName("*****");
                    dto.setLastName("*****");
                    dto.setEmail("*****");
                    dto.setRollNumber("*****");
                    dto.setClassName("*****");
                    dto.setSection("*****");
                    dto.setTotalMarks(null);
                    dto.setPercentage(null);
                }
            } else {
                dto.setFirstName(student.getFirstName());
                dto.setLastName(student.getLastName());
                dto.setEmail(student.getEmail());
                dto.setRollNumber(student.getRollNumber());
                dto.setTotalMarks(ranking.getTotalMarks());
                dto.setPercentage(ranking.getPercentage());
            }
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/performance")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<StudentPerformanceDTO> getStudentPerformance(@PathVariable Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new com.varsha.studentservice.exception.ResourceNotFoundException("Student profile not found for id: " + id));

        if ("Deleted".equals(student.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Ranking> rankingOpt = rankingRepository.findByStudentId(student.getId());
        Integer rank = rankingOpt.map(Ranking::getRank).orElse(null);
        Double totalMarks = rankingOpt.map(Ranking::getTotalMarks).orElse(0.0);
        Double percentage = rankingOpt.map(Ranking::getPercentage).orElse(0.0);

        List<Mark> marks = markRepository.findByStudentId(student.getId());
        List<MarkDTO> markDTOs = marks.stream()
                .map(m -> new MarkDTO(m.getSubject(), m.getMarks()))
                .collect(Collectors.toList());

        long totalAttendance = attendanceRepository.countByStudentId(student.getId());
        long presentDays = attendanceRepository.countByStudentIdAndStatus(student.getId(), "PRESENT");
        long absentDays = attendanceRepository.countByStudentIdAndStatus(student.getId(), "ABSENT");
        double attendanceRate = totalAttendance > 0 ? ((double) presentDays / totalAttendance) * 100.0 : 100.0;

        StudentDTO studentDTO = new StudentDTO();
        studentDTO.setId(student.getId());
        studentDTO.setFirstName(student.getFirstName());
        studentDTO.setLastName(student.getLastName());
        studentDTO.setEmail(student.getEmail());
        studentDTO.setRollNumber(student.getRollNumber());
        studentDTO.setClassName(student.getClassName());
        studentDTO.setSection(student.getSection());
        studentDTO.setPhoneNumber(student.getPhoneNumber());
        studentDTO.setStatus(student.getStatus());
        studentDTO.setEnrollmentDate(student.getEnrollmentDate());
        studentDTO.setUserId(student.getUserId());

        StudentPerformanceDTO dto = new StudentPerformanceDTO(
                studentDTO, rank, totalMarks, percentage, markDTOs,
                totalAttendance, presentDays, absentDays, attendanceRate
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/my-performance")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<StudentPerformanceDTO> getMyPerformance() {
        String selfEmail = getEmailFromToken();
        if (selfEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Student student = studentRepository.findByEmail(selfEmail)
                .orElseThrow(() -> new com.varsha.studentservice.exception.ResourceNotFoundException("Student profile not found for email: " + selfEmail));

        if ("Deleted".equals(student.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Ranking> rankingOpt = rankingRepository.findByStudentId(student.getId());
        Integer rank = rankingOpt.map(Ranking::getRank).orElse(null);
        Double totalMarks = rankingOpt.map(Ranking::getTotalMarks).orElse(0.0);
        Double percentage = rankingOpt.map(Ranking::getPercentage).orElse(0.0);

        List<Mark> marks = markRepository.findByStudentId(student.getId());
        List<MarkDTO> markDTOs = marks.stream()
                .map(m -> new MarkDTO(m.getSubject(), m.getMarks()))
                .collect(Collectors.toList());

        long totalAttendance = attendanceRepository.countByStudentId(student.getId());
        long presentDays = attendanceRepository.countByStudentIdAndStatus(student.getId(), "PRESENT");
        long absentDays = attendanceRepository.countByStudentIdAndStatus(student.getId(), "ABSENT");
        double attendanceRate = totalAttendance > 0 ? ((double) presentDays / totalAttendance) * 100.0 : 100.0;

        StudentDTO studentDTO = new StudentDTO();
        studentDTO.setId(student.getId());
        studentDTO.setFirstName(student.getFirstName());
        studentDTO.setLastName(student.getLastName());
        studentDTO.setEmail(student.getEmail());
        studentDTO.setRollNumber(student.getRollNumber());
        studentDTO.setClassName(student.getClassName());
        studentDTO.setSection(student.getSection());
        studentDTO.setPhoneNumber(student.getPhoneNumber());
        studentDTO.setStatus(student.getStatus());
        studentDTO.setEnrollmentDate(student.getEnrollmentDate());
        studentDTO.setUserId(student.getUserId());

        StudentPerformanceDTO dto = new StudentPerformanceDTO(
                studentDTO, rank, totalMarks, percentage, markDTOs,
                totalAttendance, presentDays, absentDays, attendanceRate
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/dashboard-summary")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary() {
        String token = request.getHeader("Authorization");
        
        long totalStudents = studentRepository.findByStatusNot("Deleted").size();
        long totalTeachers = 0;
        long totalCounselors = 0;
        
        try {
            Map<String, Long> userCounts = authServiceClient.getUserCounts(token);
            if (userCounts != null) {
                totalTeachers = userCounts.getOrDefault("teachers", 0L);
                totalCounselors = userCounts.getOrDefault("counselors", 0L);
            }
        } catch (Exception e) {
            // ignore Feign fetch failure and fall back to 0
        }

        long totalCsv = csvUploadRepository.count();

        List<Student> activeStudents = studentRepository.findByStatusNot("Deleted");
        double overallAttendanceRate = 100.0;
        long totalPresentCount = 0;
        long totalAttendanceCount = 0;
        
        List<StudentAtRiskDTO> riskList = new ArrayList<>();

        for (Student s : activeStudents) {
            long totalDays = attendanceRepository.countByStudentId(s.getId());
            long presentDays = attendanceRepository.countByStudentIdAndStatus(s.getId(), "PRESENT");
            
            totalAttendanceCount += totalDays;
            totalPresentCount += presentDays;

            if (totalDays > 0) {
                double rate = ((double) presentDays / totalDays) * 100.0;
                if (rate < 75.0) {
                    riskList.add(new StudentAtRiskDTO(s.getId(), s.getRollNumber(), s.getFirstName(), s.getLastName(), s.getEmail(), rate));
                }
            }
        }

        if (totalAttendanceCount > 0) {
            overallAttendanceRate = ((double) totalPresentCount / totalAttendanceCount) * 100.0;
        }

        List<Ranking> rankings = rankingRepository.findAllByOrderByRankAsc();
        List<StudentRankingDTO> topPerformers = new ArrayList<>();
        int count = 0;
        for (Ranking ranking : rankings) {
            if (count >= 5) break;
            Optional<Student> studentOpt = studentRepository.findById(ranking.getStudentId());
            if (!studentOpt.isPresent() || "Deleted".equals(studentOpt.get().getStatus())) {
                continue;
            }
            Student student = studentOpt.get();
            StudentRankingDTO dto = new StudentRankingDTO(
                    student.getId(), ranking.getRank(), student.getRollNumber(),
                    student.getFirstName(), student.getLastName(), student.getEmail(),
                    student.getClassName(), student.getSection(), ranking.getTotalMarks(),
                    ranking.getPercentage(), false
            );
            topPerformers.add(dto);
            count++;
        }

        DashboardSummaryDTO summary = new DashboardSummaryDTO(
                totalStudents, totalTeachers, totalCounselors, totalCsv,
                overallAttendanceRate, topPerformers, riskList
        );
        return ResponseEntity.ok(summary);
    }
}
