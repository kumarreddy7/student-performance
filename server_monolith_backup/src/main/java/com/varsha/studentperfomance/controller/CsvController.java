package com.varsha.studentperfomance.controller;

import com.varsha.studentperfomance.dto.MessageResponse;
import com.varsha.studentperfomance.service.CsvService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/csv")
public class CsvController {

    @Autowired
    private CsvService csvService;

    @PostMapping("/upload/students")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<MessageResponse> uploadStudentCsv(@RequestParam("file") MultipartFile file) {
        String message = csvService.processStudentCsv(file);
        return ResponseEntity.ok(new MessageResponse(message));
    }
}
