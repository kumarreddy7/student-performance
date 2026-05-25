package com.varsha.studentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentAtRiskDTO {
    private Long studentId;
    private String rollNumber;
    private String firstName;
    private String lastName;
    private String email;
    private Double attendanceRate;
}
