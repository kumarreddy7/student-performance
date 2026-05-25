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
    private CounselingAppointmentRepository counselingAppointmentRepository;

    @Autowired
    private CounselorOffDateRepository counselorOffDateRepository;

    @Autowired
    private InterventionRepository interventionRepository;

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

    private String getUsernameFromToken() {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String jwt = headerAuth.substring(7);
            return jwtUtil.getUserNameFromJwtToken(jwt);
        }
        return "Unknown";
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<List<StudentDTO>> getAllStudents() {
        String role = getRoleFromToken();
        if ("ROLE_COUNSELOR".equals(role)) {
            String counselorUsername = getUsernameFromToken();
            return ResponseEntity.ok(studentService.getStudentsByCounselor(counselorUsername));
        }
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<Page<StudentDTO>> getStudentsPaged(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "search", defaultValue = "") String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        String role = getRoleFromToken();
        String counselorUsername = "ROLE_COUNSELOR".equals(role) ? getUsernameFromToken() : null;
        return ResponseEntity.ok(studentService.getStudentsPaged(search, counselorUsername, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<StudentDTO> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR') or hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<StudentDTO> createStudent(@Valid @RequestBody StudentDTO studentDTO) {
        return new ResponseEntity<>(studentService.createStudent(studentDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<StudentDTO> updateStudent(@PathVariable Long id, @Valid @RequestBody StudentDTO studentDTO) {
        return ResponseEntity.ok(studentService.updateStudent(id, studentDTO));
    }

    @PatchMapping("/{id}/counselor")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> allocateCounselor(
            @PathVariable Long id,
            @RequestParam("counselorUsername") String counselorUsername) {
        studentService.allocateCounselor(id, counselorUsername);
        return ResponseEntity.ok().build();
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

    @PostMapping("/attendance")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<Void> saveAttendance(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody List<AttendanceDTO> attendanceList) {
        String markedBy = getUsernameFromToken();
        attendanceService.saveAttendance(date, attendanceList, markedBy);
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
            dto.setBranch(student.getBranch());

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
                    dto.setBranch("*****");
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
        studentDTO.setBranch(student.getBranch());
        studentDTO.setPhoneNumber(student.getPhoneNumber());
        studentDTO.setStatus(student.getStatus());
        studentDTO.setEnrollmentDate(student.getEnrollmentDate());
        studentDTO.setUserId(student.getUserId());
        studentDTO.setCounselorUsername(student.getCounselorUsername());

        StudentPerformanceDTO dto = new StudentPerformanceDTO(
                studentDTO, rank, totalMarks, percentage, markDTOs,
                totalAttendance, presentDays, absentDays, attendanceRate
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/my-batch-peers")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<List<StudentDTO>> getMyBatchPeers() {
        String selfEmail = getEmailFromToken();
        if (selfEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Student student = studentRepository.findByEmail(selfEmail)
                .orElseThrow(() -> new com.varsha.studentservice.exception.ResourceNotFoundException("Student profile not found for email: " + selfEmail));

        if ("Deleted".equals(student.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String counselor = student.getCounselorUsername();
        if (counselor == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Student> peers = studentRepository.findByCounselorUsernameAndClassNameAndBranchAndSection(
                counselor, student.getClassName(), student.getBranch(), student.getSection()
        );

        List<StudentDTO> peerDTOs = peers.stream()
                .filter(s -> !s.getEmail().equalsIgnoreCase(selfEmail) && !"Deleted".equals(s.getStatus()))
                .map(s -> {
                    StudentDTO d = new StudentDTO();
                    d.setId(s.getId());
                    d.setFirstName(s.getFirstName());
                    d.setLastName(s.getLastName());
                    d.setEmail(s.getEmail());
                    d.setRollNumber(s.getRollNumber());
                    d.setClassName(s.getClassName());
                    d.setSection(s.getSection());
                    d.setBranch(s.getBranch());
                    d.setPhoneNumber(s.getPhoneNumber());
                    d.setStatus(s.getStatus());
                    d.setCounselorUsername(s.getCounselorUsername());
                    d.setEnrollmentDate(s.getEnrollmentDate());
                    return d;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(peerDTOs);
    }

    @GetMapping("/dashboard-summary")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @RequestParam(value = "branch", required = false) String branch,
            @RequestParam(value = "sections", required = false) List<String> sections,
            @RequestParam(value = "counselorUsername", required = false) String counselorUsername) {
        String token = request.getHeader("Authorization");
        
        List<Student> activeStudents = studentRepository.findByStatusNot("Deleted");
        
        // Filter by branch
        if (branch != null && !branch.trim().isEmpty() && !"All".equalsIgnoreCase(branch)) {
            final String br = branch.trim();
            activeStudents = activeStudents.stream()
                    .filter(s -> s.getBranch() != null && s.getBranch().equalsIgnoreCase(br))
                    .collect(Collectors.toList());
        }
        
        // Filter by sections (multi-select)
        if (sections != null && !sections.isEmpty() && !sections.contains("All")) {
            activeStudents = activeStudents.stream()
                    .filter(s -> s.getSection() != null && sections.stream().anyMatch(sec -> sec.equalsIgnoreCase(s.getSection())))
                    .collect(Collectors.toList());
        }

        // Filter by counselor
        if (counselorUsername != null && !counselorUsername.trim().isEmpty()) {
            final String cu = counselorUsername.trim();
            activeStudents = activeStudents.stream()
                    .filter(s -> s.getCounselorUsername() != null && s.getCounselorUsername().equalsIgnoreCase(cu))
                    .collect(Collectors.toList());
        }

        long totalStudents = activeStudents.size();
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
            
            // Apply filters to top performers
            if (branch != null && !branch.trim().isEmpty() && !"All".equalsIgnoreCase(branch)) {
                if (student.getBranch() == null || !student.getBranch().equalsIgnoreCase(branch.trim())) {
                    continue;
                }
            }
            if (sections != null && !sections.isEmpty() && !sections.contains("All")) {
                if (student.getSection() == null || sections.stream().noneMatch(sec -> sec.equalsIgnoreCase(student.getSection()))) {
                    continue;
                }
            }
            if (counselorUsername != null && !counselorUsername.trim().isEmpty()) {
                if (student.getCounselorUsername() == null || !student.getCounselorUsername().equalsIgnoreCase(counselorUsername.trim())) {
                    continue;
                }
            }

            StudentRankingDTO dto = new StudentRankingDTO(
                    student.getId(), ranking.getRank(), student.getRollNumber(),
                    student.getFirstName(), student.getLastName(), student.getEmail(),
                    student.getClassName(), student.getSection(), student.getBranch(), ranking.getTotalMarks(),
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

    @PutMapping("/my-profile")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<StudentDTO> updateMyProfile(@RequestBody Map<String, String> body) {
        String email = getEmailFromToken();
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Student student = studentRepository.findByEmail(email)
                .orElseThrow(() -> new com.varsha.studentservice.exception.ResourceNotFoundException("Student profile not found for email: " + email));

        if ("Deleted".equals(student.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String newPhoneNumber = body.get("phoneNumber");
        if (newPhoneNumber != null) {
            student.setPhoneNumber(newPhoneNumber);
        }

        String newEmail = body.get("email");
        if (newEmail != null && !newEmail.trim().isEmpty() && !newEmail.equalsIgnoreCase(student.getEmail())) {
            if (studentRepository.findByEmail(newEmail).isPresent()) {
                throw new com.varsha.studentservice.exception.BadRequestException("Email is already in use by another student.");
            }
            student.setEmail(newEmail);
        }

        studentRepository.save(student);

        StudentDTO dto = new StudentDTO();
        dto.setId(student.getId());
        dto.setFirstName(student.getFirstName());
        dto.setLastName(student.getLastName());
        dto.setEmail(student.getEmail());
        dto.setRollNumber(student.getRollNumber());
        dto.setClassName(student.getClassName());
        dto.setSection(student.getSection());
        dto.setBranch(student.getBranch());
        dto.setPhoneNumber(student.getPhoneNumber());
        dto.setStatus(student.getStatus());
        dto.setEnrollmentDate(student.getEnrollmentDate());
        dto.setUserId(student.getUserId());
        dto.setCounselorUsername(student.getCounselorUsername());

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/wipe-database")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> wipeDatabase() {
        counselingAppointmentRepository.deleteAll();
        counselorOffDateRepository.deleteAll();
        interventionRepository.deleteAll();
        attendanceRepository.deleteAll();
        markRepository.deleteAll();
        rankingRepository.deleteAll();
        csvUploadRepository.deleteAll();
        studentRepository.deleteAll();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Entire student database has been successfully wiped.");
        return ResponseEntity.ok(response);
    }
}

