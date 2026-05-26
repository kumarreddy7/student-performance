package com.varsha.studentservice.repository;

import com.varsha.studentservice.entity.AssignmentMark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssignmentMarkRepository extends JpaRepository<AssignmentMark, Long> {
    List<AssignmentMark> findByStudentId(Long studentId);
    List<AssignmentMark> findByStudentIdAndSubject(Long studentId, String subject);
    void deleteByStudentId(Long studentId);
}
