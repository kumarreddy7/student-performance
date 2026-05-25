package com.varsha.studentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "counseling_appointments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"counselor_username", "date", "time_slot"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CounselingAppointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private String studentName;

    @Column(name = "counselor_username", nullable = false)
    private String counselorUsername;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "time_slot", nullable = false)
    private String timeSlot; // e.g. "09:00 - 10:00"

    @Column(nullable = false)
    private String status; // "PENDING", "ACCEPTED", "REJECTED"

    private String rejectionReason;
}
