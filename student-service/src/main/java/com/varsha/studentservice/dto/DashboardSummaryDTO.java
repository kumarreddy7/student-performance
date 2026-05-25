package com.varsha.studentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private long totalStudents;
    private long totalTeachers;
    private long totalCounselors;
    private long totalCsvUploads;
    private double overallAttendanceRate;
    private List<StudentRankingDTO> topPerformers;
    private List<StudentAtRiskDTO> studentsAtRisk;
}
