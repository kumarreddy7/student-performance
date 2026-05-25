package com.varsha.studentservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InterventionDTO {
    private Long id;
    private Long studentId;
    
    @NotBlank
    private String counselorName;
    
    @NotBlank
    private String type;
    
    @NotBlank
    private String notes;
    
    private LocalDateTime createdAt;
}
