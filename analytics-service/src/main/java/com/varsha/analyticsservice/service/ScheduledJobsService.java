package com.varsha.analyticsservice.service;

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
    private JwtUtil jwtUtil;

    // Run every day at midnight
    @Scheduled(cron = "0 0 0 * * ?")
    public void recalculateDailyRisks() {
        logger.info("Starting daily risk recalculation job");
        try {
            String token = "Bearer " + jwtUtil.generateSystemToken();
            List<StudentDTO> students = studentServiceClient.getAllStudents(token);
            
            logger.info("Fetched {} students for recalculation", students.size());
            
            for (StudentDTO student : students) {
                String currentSemester = "Spring 2026"; 
                
                // For a real application, we would use real historical or live data.
                // Using dummy variations based on existing logic
                double randomGpa = 2.0 + Math.random() * 2.0;
                double randomAttendance = 70.0 + Math.random() * 30.0;
                double randomBehavior = 5.0 + Math.random() * 5.0;
                
                predictionEngineService.calculateAndSaveRisk(
                        student.getId(), 
                        currentSemester, 
                        randomGpa, 
                        randomAttendance, 
                        randomBehavior
                );
            }
            logger.info("Daily risk recalculation job completed successfully");
        } catch (Exception e) {
            logger.error("Error during daily risk recalculation", e);
        }
    }
}
