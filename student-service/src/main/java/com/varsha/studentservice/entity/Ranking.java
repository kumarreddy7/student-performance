package com.varsha.studentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "rankings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ranking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false, unique = true)
    private Long studentId;

    @Column(nullable = false)
    private Integer rank;

    @Column(name = "total_marks", nullable = false)
    private Double totalMarks;

    @Column(nullable = false)
    private Double percentage;
}
