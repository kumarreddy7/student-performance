package com.varsha.studentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentPerformanceDTO {
    private StudentDTO student;
    private Integer rank;
    private Double totalMarks;
    private Double percentage;
    private List<MarkDTO> marks;
    private long totalAttendanceDays;
    private long presentDays;
    private long absentDays;
    private double attendanceRate;
}
