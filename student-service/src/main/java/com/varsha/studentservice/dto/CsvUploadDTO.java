package com.varsha.studentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CsvUploadDTO {
    private Long id;
    private String fileName;
    private LocalDateTime uploadDate;
    private String uploadedBy;
    private String fileType;
}
