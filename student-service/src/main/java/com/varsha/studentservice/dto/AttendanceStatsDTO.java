package com.varsha.studentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceStatsDTO {
    private long dayPresent;
    private long dayTotal;
    private double dayPercentage;
    private long monthPresent;
    private long monthTotal;
    private double monthPercentage;
}
