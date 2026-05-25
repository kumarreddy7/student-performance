package com.varsha.studentservice.dto;

import lombok.Data;

@Data
public class AttendanceDTO {
    private Long studentId;
    private String status; // "PRESENT" or "ABSENT"
}
