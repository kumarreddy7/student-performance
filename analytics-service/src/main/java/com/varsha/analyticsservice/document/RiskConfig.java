package com.varsha.analyticsservice.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "risk_configurations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskConfig {
    @Id
    private String id = "default";

    private Double predictedGradeThreshold = 60.0;  // failure boundary (e.g. < 60)
    private Double attendanceThreshold = 85.0;      // attendance boundary (e.g. < 85%)
    private Double behaviorThreshold = 7.0;          // behavior boundary (e.g. < 7)

    private Double lowRiskMaxLimit = 30.0;           // riskScore < 30 is LOW
    private Double mediumRiskMaxLimit = 70.0;        // riskScore < 70 is MEDIUM
}
