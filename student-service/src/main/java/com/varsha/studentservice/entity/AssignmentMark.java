package com.varsha.studentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "assignment_marks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentMark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private String subject;

    @Column(name = "assignment_name", nullable = false)
    private String assignmentName; // "Assignment 1", "Assignment 2", "Assignment 3"

    @Column(nullable = false)
    private Double marks;
}
