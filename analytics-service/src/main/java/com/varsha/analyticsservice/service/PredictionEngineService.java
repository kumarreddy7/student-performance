package com.varsha.analyticsservice.service;

import com.varsha.analyticsservice.document.RiskConfig;
import com.varsha.analyticsservice.repository.RiskConfigRepository;
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

    @Autowired
    private RiskConfigRepository riskConfigRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Statistical prediction model.
     * Computes Risk Score dynamically based on database configurations.
     */
    public PerformanceRecord calculateAndSaveRisk(Long studentId, String semester, Double gpa, Double attendance, Double behavior) {
        
        // Ensure constraints
        gpa = Math.max(0.0, Math.min(4.0, gpa));
        attendance = Math.max(0.0, Math.min(100.0, attendance));
        behavior = Math.max(0.0, Math.min(10.0, behavior));

        // Fetch previous risk history to monitor tier transitions
        List<PerformanceRecord> history = repository.findByStudentId(studentId);
        String previousCategory = "LOW";
        if (history != null && !history.isEmpty()) {
            previousCategory = history.get(history.size() - 1).getRiskCategory();
        }

        RiskConfig config = riskConfigRepository.findById("default").orElse(new RiskConfig());
        double gpaPercentage = gpa * 25.0; // convert 4.0 scale to 100.0 percentage

        double riskScore = 0.0;
        
        // Calculate based on dynamic threshold differences
        if (gpaPercentage < config.getPredictedGradeThreshold()) {
            riskScore += (config.getPredictedGradeThreshold() - gpaPercentage) * 1.5;
        }
        if (attendance < config.getAttendanceThreshold()) {
            riskScore += (config.getAttendanceThreshold() - attendance) * 2.0;
        }
        if (behavior < config.getBehaviorThreshold()) {
            riskScore += (config.getBehaviorThreshold() - behavior) * 5.0;
        }

        riskScore = Math.max(0.0, Math.min(100.0, riskScore)); // Cap at 100

        String category;
        if (riskScore < config.getLowRiskMaxLimit()) {
            category = "LOW";
        } else if (riskScore < config.getMediumRiskMaxLimit()) {
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

        PerformanceRecord savedRecord = repository.save(record);

        // Dynamic alert dispatches on category transitions
        if (!previousCategory.equals(category)) {
            if ("HIGH".equals(category)) {
                // Req 15: Counselor Alert
                emailService.sendEmail(
                    "counselor@school.edu",
                    "URGENT: Student Risk Alert (Student ID: " + studentId + ")",
                    "Hello Counselor,\n\n" +
                    "This is an automated alert. Student ID " + studentId + " has dropped into the HIGH RISK tier for the semester: " + semester + ".\n\n" +
                    "Metrics Overview:\n" +
                    "- Predicted Grade Average: " + Math.round(gpaPercentage * 100.0) / 100.0 + "%\n" +
                    "- Attendance Rate: " + attendance + "%\n" +
                    "- Behavior Score: " + behavior + "/10\n\n" +
                    "Please log in to the Student Performance Predictor Dashboard immediately to evaluate this student's profile and schedule a proactive counseling intervention.\n\n" +
                    "Best regards,\n" +
                    "Student Performance Predictor System"
                );
            } else if ("LOW".equals(category) && "HIGH".equals(previousCategory)) {
                // Req 17: Milestone Celebration
                emailService.sendEmail(
                    "counselor@school.edu",
                    "Milestone Celebration: Student ID: " + studentId + " is now SAFE!",
                    "Hello Counselor,\n\n" +
                    "Great news! Student ID " + studentId + " has successfully transitioned from the HIGH RISK tier into the SAFE (LOW RISK) tier.\n\n" +
                    "Current metrics show an attendance rate of " + attendance + "% and a predicted academic grade average of " + Math.round(gpaPercentage * 100.0) / 100.0 + "%.\n\n" +
                    "This is a wonderful milestone! Please congratulate the student on their effort and progress.\n\n" +
                    "Best regards,\n" +
                    "Student Performance Predictor System"
                );
            }
        }

        return savedRecord;
    }

    public List<PerformanceRecord> getStudentHistory(Long studentId) {
        return repository.findByStudentId(studentId);
    }

    public List<PerformanceRecord> getAllRecords() {
        return repository.findAll();
    }
}
