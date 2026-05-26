package com.varsha.analyticsservice.dto;

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
    
    private long totalAttendance;
    private long presentDays;
    private long absentDays;
    private double attendanceRate;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarkDTO {
        private String subject;
        private Double marks;
    }
}
