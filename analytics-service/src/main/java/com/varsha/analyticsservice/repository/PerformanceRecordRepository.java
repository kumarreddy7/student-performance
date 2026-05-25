package com.varsha.analyticsservice.repository;

import com.varsha.analyticsservice.document.PerformanceRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceRecordRepository extends MongoRepository<PerformanceRecord, String> {
    List<PerformanceRecord> findByStudentId(Long studentId);
}
