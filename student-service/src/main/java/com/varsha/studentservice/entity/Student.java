package com.varsha.studentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    
    @Column(unique = true)
    private String email;

    @Column(unique = true)
    private String rollNumber;

    private String className;
    private String section;
    private String branch;
    private String phoneNumber;
    
    private String counselorUsername;
    
    // Status can be Active, Inactive, Deleted
    private String status = "Active";

    private LocalDate enrollmentDate;

    // Optional linkage to a User account (user ID stored instead of full User entity to keep microservices decoupled)
    @Column(name = "user_id")
    private Long userId; 
}
