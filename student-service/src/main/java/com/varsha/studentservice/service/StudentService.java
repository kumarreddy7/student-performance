package com.varsha.studentservice.service;

import com.varsha.studentservice.dto.StudentDTO;
import com.varsha.studentservice.dto.InterventionDTO;
import com.varsha.studentservice.entity.Student;
import com.varsha.studentservice.entity.Intervention;
import com.varsha.studentservice.exception.BadRequestException;
import com.varsha.studentservice.exception.ResourceNotFoundException;
import com.varsha.studentservice.repository.StudentRepository;
import com.varsha.studentservice.repository.InterventionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private RankingEngineService rankingEngineService;

    @Autowired
    private com.varsha.studentservice.repository.TeacherClassRepository teacherClassRepository;

    public List<StudentDTO> getAllStudents() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        List<Student> students;
        
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> "ROLE_TEACHER".equals(a.getAuthority()))) {
            String email = auth.getName();
            List<com.varsha.studentservice.entity.TeacherClass> classes = teacherClassRepository.findByTeacherEmail(email);
            
            students = studentRepository.findByStatusNot("Deleted").stream()
                    .filter(s -> classes.stream().anyMatch(c -> 
                            c.getClassName().equalsIgnoreCase(s.getClassName()) && 
                            c.getSection().equalsIgnoreCase(s.getSection())))
                    .collect(Collectors.toList());
        } else {
            students = studentRepository.findByStatusNot("Deleted");
        }
        
        return students.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Page<StudentDTO> getStudentsPaged(String search, Pageable pageable) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> "ROLE_TEACHER".equals(a.getAuthority()))) {
            String email = auth.getName();
            List<com.varsha.studentservice.entity.TeacherClass> classes = teacherClassRepository.findByTeacherEmail(email);
            
            List<StudentDTO> list = studentRepository.searchStudents("Deleted", search, Pageable.unpaged()).stream()
                    .filter(s -> classes.stream().anyMatch(c -> 
                            c.getClassName().equalsIgnoreCase(s.getClassName()) && 
                            c.getSection().equalsIgnoreCase(s.getSection())))
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
            
            int start = (int) pageable.getOffset();
            if (start > list.size()) {
                return new org.springframework.data.domain.PageImpl<>(new java.util.ArrayList<>(), pageable, list.size());
            }
            int end = Math.min((start + pageable.getPageSize()), list.size());
            return new org.springframework.data.domain.PageImpl<>(list.subList(start, end), pageable, list.size());
        }
        
        return studentRepository.searchStudents("Deleted", search, pageable)
                .map(this::mapToDTO);
    }

    public StudentDTO getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + id));
        if ("Deleted".equals(student.getStatus())) {
            throw new ResourceNotFoundException("Student has been deleted");
        }
        return mapToDTO(student);
    }

    @Transactional
    public StudentDTO createStudent(StudentDTO studentDTO) {
        if (studentRepository.existsByEmail(studentDTO.getEmail())) {
            throw new BadRequestException("Student with email already exists");
        }
        if (studentRepository.existsByRollNumber(studentDTO.getRollNumber())) {
            throw new BadRequestException("Student with roll number already exists");
        }
        Student student = mapToEntity(studentDTO);
        student.setStatus("Active");
        Student savedStudent = studentRepository.save(student);
        rankingEngineService.calculateRankings();
        return mapToDTO(savedStudent);
    }

    @Transactional
    public StudentDTO updateStudent(Long id, StudentDTO studentDTO) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + id));

        if ("Deleted".equals(student.getStatus())) {
            throw new BadRequestException("Cannot update a deleted student");
        }

        student.setFirstName(studentDTO.getFirstName());
        student.setLastName(studentDTO.getLastName());
        
        // Do not update email if it already exists for another user
        if (!student.getEmail().equalsIgnoreCase(studentDTO.getEmail()) && studentRepository.existsByEmail(studentDTO.getEmail())) {
            throw new BadRequestException("Student with email already exists");
        }
        
        // Do not update roll number if it already exists for another user
        if (!student.getRollNumber().equalsIgnoreCase(studentDTO.getRollNumber()) && studentRepository.existsByRollNumber(studentDTO.getRollNumber())) {
            throw new BadRequestException("Student with roll number already exists");
        }

        student.setEmail(studentDTO.getEmail());
        student.setRollNumber(studentDTO.getRollNumber());
        student.setClassName(studentDTO.getClassName());
        student.setSection(studentDTO.getSection());
        student.setPhoneNumber(studentDTO.getPhoneNumber());
        if (studentDTO.getStatus() != null) {
            student.setStatus(studentDTO.getStatus());
        }
        student.setEnrollmentDate(studentDTO.getEnrollmentDate());

        Student updatedStudent = studentRepository.save(student);
        rankingEngineService.calculateRankings();
        return mapToDTO(updatedStudent);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + id));
        student.setStatus("Deleted");
        studentRepository.save(student);
        rankingEngineService.calculateRankings();
    }

    // Intervention Methods
    public InterventionDTO addIntervention(Long studentId, InterventionDTO dto) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
        if ("Deleted".equals(student.getStatus())) {
            throw new BadRequestException("Cannot add intervention for a deleted student");
        }

        Intervention intervention = new Intervention();
        intervention.setStudentId(studentId);
        intervention.setCounselorName(dto.getCounselorName());
        intervention.setType(dto.getType());
        intervention.setNotes(dto.getNotes());
        intervention.setCreatedAt(LocalDateTime.now());

        Intervention saved = interventionRepository.save(intervention);
        return mapToInterventionDTO(saved);
    }

    public List<InterventionDTO> getInterventionsForStudent(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
        if ("Deleted".equals(student.getStatus())) {
            throw new BadRequestException("Cannot get interventions for a deleted student");
        }

        return interventionRepository.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .map(this::mapToInterventionDTO)
                .collect(Collectors.toList());
    }

    private InterventionDTO mapToInterventionDTO(Intervention intervention) {
        InterventionDTO dto = new InterventionDTO();
        dto.setId(intervention.getId());
        dto.setStudentId(intervention.getStudentId());
        dto.setCounselorName(intervention.getCounselorName());
        dto.setType(intervention.getType());
        dto.setNotes(intervention.getNotes());
        dto.setCreatedAt(intervention.getCreatedAt());
        return dto;
    }

    private StudentDTO mapToDTO(Student student) {
        StudentDTO dto = new StudentDTO();
        dto.setId(student.getId());
        dto.setFirstName(student.getFirstName());
        dto.setLastName(student.getLastName());
        dto.setEmail(student.getEmail());
        dto.setRollNumber(student.getRollNumber());
        dto.setClassName(student.getClassName());
        dto.setSection(student.getSection());
        dto.setPhoneNumber(student.getPhoneNumber());
        dto.setStatus(student.getStatus());
        dto.setEnrollmentDate(student.getEnrollmentDate());
        dto.setUserId(student.getUserId());
        return dto;
    }

    private Student mapToEntity(StudentDTO dto) {
        Student student = new Student();
        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setEmail(dto.getEmail());
        student.setRollNumber(dto.getRollNumber());
        student.setClassName(dto.getClassName());
        student.setSection(dto.getSection());
        student.setPhoneNumber(dto.getPhoneNumber());
        student.setStatus(dto.getStatus() != null ? dto.getStatus() : "Active");
        student.setEnrollmentDate(dto.getEnrollmentDate());
        student.setUserId(dto.getUserId());
        return student;
    }
}
