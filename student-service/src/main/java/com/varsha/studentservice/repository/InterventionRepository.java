package com.varsha.studentservice.repository;

import com.varsha.studentservice.entity.Intervention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    List<Intervention> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
