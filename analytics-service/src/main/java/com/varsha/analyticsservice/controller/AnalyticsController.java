package com.varsha.analyticsservice.controller;

import com.varsha.analyticsservice.client.StudentServiceClient;
import com.varsha.analyticsservice.document.PerformanceRecord;
import com.varsha.analyticsservice.dto.GenerateDataRequest;
import com.varsha.analyticsservice.dto.StudentDTO;
import com.varsha.analyticsservice.service.PredictionEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private PredictionEngineService predictionEngineService;

    @Autowired
    private StudentServiceClient studentServiceClient;

    @PostMapping("/calculate")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<PerformanceRecord> calculateRisk(@RequestBody GenerateDataRequest request) {
        PerformanceRecord record = predictionEngineService.calculateAndSaveRisk(
                request.getStudentId(),
                request.getSemester(),
                request.getGpa(),
                request.getAttendancePercentage(),
                request.getBehaviorScore()
        );
        return ResponseEntity.ok(record);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR') or hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<Map<String, Object>> getStudentAnalytics(
            @PathVariable Long studentId,
            HttpServletRequest request) {
        
        String token = request.getHeader("Authorization");
        
        // Use Feign Client to get student info
        StudentDTO student = studentServiceClient.getStudentById(token, studentId);
        List<PerformanceRecord> history = predictionEngineService.getStudentHistory(studentId);

        Map<String, Object> response = new HashMap<>();
        response.put("student", student);
        response.put("history", history);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard/summary")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        List<PerformanceRecord> allRecords = predictionEngineService.getAllRecords();

        long highRiskCount = allRecords.stream().filter(r -> "HIGH".equals(r.getRiskCategory())).count();
        long mediumRiskCount = allRecords.stream().filter(r -> "MEDIUM".equals(r.getRiskCategory())).count();
        long lowRiskCount = allRecords.stream().filter(r -> "LOW".equals(r.getRiskCategory())).count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRecords", allRecords.size());
        summary.put("highRisk", highRiskCount);
        summary.put("mediumRisk", mediumRiskCount);
        summary.put("lowRisk", lowRiskCount);
        
        // Send actual records for the charts
        summary.put("records", allRecords);

        return ResponseEntity.ok(summary);
    }

    @PostMapping("/wipe-database")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> wipeDatabase() {
        predictionEngineService.wipeAllRecords();
        Map<String, String> response = new java.util.HashMap<>();
        response.put("message", "All performance prediction data wiped successfully.");
        return ResponseEntity.ok(response);
    }
}

