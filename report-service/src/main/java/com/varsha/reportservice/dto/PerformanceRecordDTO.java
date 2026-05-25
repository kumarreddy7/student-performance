package com.varsha.reportservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PerformanceRecordDTO {
    private String id;
    private Long studentId;
    private String semester;
    private Double gpa;
    private Double attendancePercentage;
    private Double behaviorScore;
    private Double riskScore;
    private String riskCategory;
    private LocalDateTime createdAt;
}
