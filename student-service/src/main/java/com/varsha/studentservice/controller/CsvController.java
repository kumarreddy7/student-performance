package com.varsha.studentservice.controller;

import com.varsha.studentservice.dto.MessageResponse;
import com.varsha.studentservice.dto.CsvUploadDTO;
import com.varsha.studentservice.entity.CsvUpload;
import com.varsha.studentservice.repository.CsvUploadRepository;
import com.varsha.studentservice.service.CsvService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/csv")
public class CsvController {

    @Autowired
    private CsvService csvService;

    @Autowired
    private CsvUploadRepository csvUploadRepository;

    @PostMapping("/upload/students")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<MessageResponse> uploadStudentCsv(@RequestParam("file") MultipartFile file) {
        String message = csvService.processStudentCsv(file);
        return ResponseEntity.ok(new MessageResponse(message));
    }

    @PostMapping("/upload/marks")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<MessageResponse> uploadMarksCsv(@RequestParam("file") MultipartFile file) {
        String message = csvService.processMarksCsv(file);
        return ResponseEntity.ok(new MessageResponse(message));
    }

    @GetMapping("/files")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<List<CsvUploadDTO>> getCsvLogs() {
        List<CsvUploadDTO> logs = csvUploadRepository.findAll().stream()
                .map(log -> new CsvUploadDTO(log.getId(), log.getFileName(), log.getUploadDate(), log.getUploadedBy(), log.getFileType()))
                .sorted((f1, f2) -> f2.getUploadDate().compareTo(f1.getUploadDate()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/files/{id}/download")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<byte[]> downloadCsv(@PathVariable Long id) {
        CsvUpload log = csvUploadRepository.findById(id)
                .orElseThrow(() -> new com.varsha.studentservice.exception.ResourceNotFoundException("File log not found with id " + id));
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + log.getFileName() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv")
                .body(log.getData());
    }

    @DeleteMapping("/files/{id}")
    @PreAuthorize("denyAll()")
    public ResponseEntity<Void> deleteCsvLog(@PathVariable Long id) {
        throw new com.varsha.studentservice.exception.BadRequestException("Deletion of CSV upload history is disabled.");
    }
}
