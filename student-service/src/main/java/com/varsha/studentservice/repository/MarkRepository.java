package com.varsha.studentservice.repository;

import com.varsha.studentservice.entity.Mark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MarkRepository extends JpaRepository<Mark, Long> {
    List<Mark> findByStudentId(Long studentId);
    Optional<Mark> findByStudentIdAndSubject(Long studentId, String subject);
    void deleteByStudentId(Long studentId);
}
