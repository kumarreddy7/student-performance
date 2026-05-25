package com.varsha.studentperfomance.service;

import com.varsha.studentperfomance.dto.StudentDTO;
import com.varsha.studentperfomance.entity.Student;
import com.varsha.studentperfomance.exception.BadRequestException;
import com.varsha.studentperfomance.exception.ResourceNotFoundException;
import com.varsha.studentperfomance.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public StudentDTO getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + id));
        return mapToDTO(student);
    }

    public StudentDTO createStudent(StudentDTO studentDTO) {
        if (studentRepository.existsByEmail(studentDTO.getEmail())) {
            throw new BadRequestException("Student with email already exists");
        }
        Student student = mapToEntity(studentDTO);
        Student savedStudent = studentRepository.save(student);
        return mapToDTO(savedStudent);
    }

    public StudentDTO updateStudent(Long id, StudentDTO studentDTO) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + id));

        student.setFirstName(studentDTO.getFirstName());
        student.setLastName(studentDTO.getLastName());
        // Do not update email if it already exists for another user
        if (!student.getEmail().equals(studentDTO.getEmail()) && studentRepository.existsByEmail(studentDTO.getEmail())) {
            throw new BadRequestException("Student with email already exists");
        }
        student.setEmail(studentDTO.getEmail());
        student.setEnrollmentDate(studentDTO.getEnrollmentDate());

        Student updatedStudent = studentRepository.save(student);
        return mapToDTO(updatedStudent);
    }

    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + id));
        studentRepository.delete(student);
    }

    private StudentDTO mapToDTO(Student student) {
        StudentDTO dto = new StudentDTO();
        dto.setId(student.getId());
        dto.setFirstName(student.getFirstName());
        dto.setLastName(student.getLastName());
        dto.setEmail(student.getEmail());
        dto.setEnrollmentDate(student.getEnrollmentDate());
        if (student.getUser() != null) {
            dto.setUserId(student.getUser().getId());
        }
        return dto;
    }

    private Student mapToEntity(StudentDTO dto) {
        Student student = new Student();
        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setEmail(dto.getEmail());
        student.setEnrollmentDate(dto.getEnrollmentDate());
        return student;
    }
}
