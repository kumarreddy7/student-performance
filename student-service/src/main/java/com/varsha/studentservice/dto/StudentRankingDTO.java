package com.varsha.studentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentRankingDTO {
    private Long studentId;
    private Integer rank;
    private String rollNumber;
    private String firstName;
    private String lastName;
    private String email;
    private String className;
    private String section;
    private Double totalMarks;
    private Double percentage;
    private Boolean isSelf;
}
