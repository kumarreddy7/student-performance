package com.varsha.analyticsservice.service;

import com.varsha.analyticsservice.document.PerformanceRecord;
import com.varsha.analyticsservice.repository.PerformanceRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PredictionEngineService {

    @Autowired
    private PerformanceRecordRepository repository;

    /**
     * Statistical prediction model.
     * Risk Score Formula:
     * (4.0 - GPA) * 15 + (100 - Attendance) * 0.5 + (10 - Behavior) * 2
     * Max risk score capped at 100.
     */
    public PerformanceRecord calculateAndSaveRisk(Long studentId, String semester, Double gpa, Double attendance, Double behavior) {
        
        // Ensure constraints
        gpa = Math.max(0.0, Math.min(4.0, gpa));
        attendance = Math.max(0.0, Math.min(100.0, attendance));
        behavior = Math.max(0.0, Math.min(10.0, behavior));

        // Statistical calculation (Simple linear combination for MVP)
        double riskScore = ((4.0 - gpa) * 15.0) + ((100.0 - attendance) * 0.5) + ((10.0 - behavior) * 2.0);
        riskScore = Math.max(0.0, Math.min(100.0, riskScore)); // Cap at 100

        String category;
        if (riskScore < 30) {
            category = "LOW";
        } else if (riskScore < 70) {
            category = "MEDIUM";
        } else {
            category = "HIGH";
        }

        PerformanceRecord record = new PerformanceRecord();
        record.setStudentId(studentId);
        record.setSemester(semester);
        record.setGpa(gpa);
        record.setAttendancePercentage(attendance);
        record.setBehaviorScore(behavior);
        record.setRiskScore(Math.round(riskScore * 100.0) / 100.0); // 2 decimal places
        record.setRiskCategory(category);
        record.setCreatedAt(LocalDateTime.now());

        return repository.save(record);
    }

    public List<PerformanceRecord> getStudentHistory(Long studentId) {
        return repository.findByStudentId(studentId);
    }

    public List<PerformanceRecord> getAllRecords() {
        return repository.findAll();
    }

    public void wipeAllRecords() {
        repository.deleteAll();
    }
}

