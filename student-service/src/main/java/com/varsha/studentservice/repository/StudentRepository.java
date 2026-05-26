package com.varsha.studentservice.repository;

import com.varsha.studentservice.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Boolean existsByEmail(String email);
    Boolean existsByRollNumber(String rollNumber);
    Optional<Student> findByRollNumber(String rollNumber);
    Optional<Student> findByEmail(String email);
    List<Student> findByStatusNot(String status);
    Page<Student> findByStatusNot(String status, Pageable pageable);

    @Query("SELECT s FROM Student s WHERE s.status <> :status " +
           "AND (:search IS NULL OR :search = '' OR LOWER(s.rollNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.className) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.section) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Student> searchStudents(
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );
}
