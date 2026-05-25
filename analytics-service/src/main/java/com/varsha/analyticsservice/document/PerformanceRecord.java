package com.varsha.analyticsservice.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "performance_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceRecord {
    @Id
    private String id;

    private Long studentId;
    private String semester;
    private Double gpa;
    private Double attendancePercentage;
    private Double behaviorScore; // 0 to 10
    
    // Predicted Risk
    private Double riskScore; // 0 to 100
    private String riskCategory; // LOW, MEDIUM, HIGH

    private LocalDateTime createdAt;
}
