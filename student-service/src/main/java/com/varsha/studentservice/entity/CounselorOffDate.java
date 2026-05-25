package com.varsha.studentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "counselor_off_dates", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"counselor_username", "date"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CounselorOffDate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "counselor_username", nullable = false)
    private String counselorUsername;

    @Column(nullable = false)
    private LocalDate date;
}
