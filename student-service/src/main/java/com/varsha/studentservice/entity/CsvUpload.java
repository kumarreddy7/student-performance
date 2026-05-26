package com.varsha.studentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "csv_uploads")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CsvUpload {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "upload_date", nullable = false)
    private LocalDateTime uploadDate;

    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy;

    @Column(name = "file_type", nullable = false)
    private String fileType; // "STUDENT" or "MARKS"

    @Lob
    @Column(name = "data", nullable = false, columnDefinition = "BYTEA")
    private byte[] data;
}
