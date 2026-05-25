package com.varsha.studentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "interventions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Intervention {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long studentId;
    private String counselorName;
    private String type; // Email, Meeting, Tutoring
    
    @Column(length = 1000)
    private String notes;
    
    private LocalDateTime createdAt;
}
