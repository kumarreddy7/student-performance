package com.varsha.reportservice.controller;

import com.varsha.reportservice.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/watchlist/pdf")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<byte[]> downloadWatchlistPdf(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        byte[] pdfBytes = reportService.generateWatchlistPdf(token);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "student-watchlist.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @GetMapping("/watchlist/excel")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_TEACHER') or hasAuthority('ROLE_COUNSELOR')")
    public ResponseEntity<byte[]> downloadWatchlistExcel(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        byte[] excelBytes = reportService.generateWatchlistExcel(token);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("filename", "student-watchlist.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .body(excelBytes);
    }
}
