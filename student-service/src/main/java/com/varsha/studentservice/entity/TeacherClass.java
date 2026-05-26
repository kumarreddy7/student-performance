package com.varsha.studentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "teacher_classes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_email", nullable = false)
    private String teacherEmail; // Matches logged-in teacher username/email

    @Column(name = "class_name", nullable = false)
    private String className; // e.g. "10th Grade"

    @Column(nullable = false)
    private String section; // e.g. "A"
}
