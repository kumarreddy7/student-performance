package com.varsha.analyticsservice.service;

import com.varsha.analyticsservice.dto.AssignmentMarkDTO;
import com.varsha.analyticsservice.dto.StudentPerformanceDTO;
import com.varsha.analyticsservice.client.StudentServiceClient;
import com.varsha.analyticsservice.dto.StudentDTO;
import com.varsha.analyticsservice.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScheduledJobsService {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledJobsService.class);

    @Autowired
    private StudentServiceClient studentServiceClient;

    @Autowired
    private PredictionEngineService predictionEngineService;

    @Autowired
    private LinearRegressionService linearRegressionService;

    @Autowired
    private JwtUtil jwtUtil;

    // Run every day at 2:00 AM to avoid database locking during school hours
    @Scheduled(cron = "0 0 2 * * ?")
    public void recalculateDailyRisks() {
        logger.info("Starting daily risk recalculation job at 2:00 AM");
        try {
            String token = "Bearer " + jwtUtil.generateSystemToken();
            List<StudentDTO> students = studentServiceClient.getAllStudents(token);
            
            logger.info("Fetched {} students for recalculation", students.size());
            
            for (StudentDTO student : students) {
                String currentSemester = "Spring 2026"; 
                
                try {
                    // Fetch real student performance metrics via Feign
                    StudentPerformanceDTO perf = studentServiceClient.getStudentPerformance(token, student.getId());
                    double attendanceRate = perf.getAttendanceRate();
                    
                    // Fetch student assignments to execute linear regression trend analysis
                    List<AssignmentMarkDTO> assignments = studentServiceClient.getAssignments(token, student.getId());
                    
                    // Predict the student's final grade percentage based on assignment trends
                    double predictedPercentage = linearRegressionService.projectFinalGrade(assignments);
                    
                    // Translate prediction percentage to a standard 4.0 GPA scale for the prediction engine
                    double predictedGpa = (predictedPercentage / 100.0) * 4.0;
                    
                    // Behavior rating defaults to a safe 8.0 out of 10.0 unless behavior-specific indicators are computed
                    double behaviorScore = 8.0; 
                    
                    predictionEngineService.calculateAndSaveRisk(
                            student.getId(), 
                            currentSemester, 
                            predictedGpa, 
                            attendanceRate, 
                            behaviorScore
                    );
                } catch (Exception innerEx) {
                    logger.error("Failed to calculate real prediction for student ID: " + student.getId() + ", falling back to static default", innerEx);
                    // Standard safe fallback values in case of missing marks history
                    predictionEngineService.calculateAndSaveRisk(student.getId(), currentSemester, 2.5, 90.0, 8.0);
                }
            }
            logger.info("Daily risk recalculation job completed successfully");
        } catch (Exception e) {
            logger.error("Error during daily risk recalculation", e);
        }
    }
}
