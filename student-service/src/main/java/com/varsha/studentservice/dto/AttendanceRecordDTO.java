package com.varsha.studentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecordDTO {
    private Long studentId;
    private String firstName;
    private String lastName;
    private String email;
    private String rollNumber;
    private String className;
    private String section;
    private String branch;
    private String status; // "PRESENT", "ABSENT", or null if not marked yet
    private String markedBy;
}
