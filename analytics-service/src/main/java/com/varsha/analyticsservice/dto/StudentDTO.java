package com.varsha.analyticsservice.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private LocalDate enrollmentDate;
    private Long userId;
}
