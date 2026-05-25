package com.varsha.analyticsservice.dto;

import lombok.Data;

@Data
public class GenerateDataRequest {
    private Long studentId;
    private String semester;
    private Double gpa;
    private Double attendancePercentage;
    private Double behaviorScore;
}
