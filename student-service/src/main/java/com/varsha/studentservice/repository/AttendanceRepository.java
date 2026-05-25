package com.varsha.studentservice.repository;

import com.varsha.studentservice.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByDate(LocalDate date);
    Optional<Attendance> findByStudentIdAndDate(Long studentId, LocalDate date);
    
    // For overall stats:
    long countByDateAndStatus(LocalDate date, String status);
    long countByDate(LocalDate date);
    
    // Monthly stats:
    long countByDateBetweenAndStatus(LocalDate startDate, LocalDate endDate, String status);
    long countByDateBetween(LocalDate startDate, LocalDate endDate);
    // For student-specific performance and risk tracking:
    List<Attendance> findByStudentId(Long studentId);
    long countByStudentId(Long studentId);
    long countByStudentIdAndStatus(Long studentId, String status);
}
