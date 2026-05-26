package com.varsha.analyticsservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentMarkDTO {
    private Long id;
    private Long studentId;
    private String subject;
    private String assignmentName;
    private Double marks;
}
