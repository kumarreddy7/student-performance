package com.varsha.reportservice.client;

import com.varsha.reportservice.dto.StudentDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@FeignClient(name = "student-service")
public interface StudentServiceClient {

    @GetMapping("/api/students")
    List<StudentDTO> getAllStudents(@RequestHeader("Authorization") String token);

    @GetMapping("/api/students/dashboard-summary")
    java.util.Map<String, Object> getDashboardSummary(
            @RequestHeader("Authorization") String token,
            @org.springframework.web.bind.annotation.RequestParam(value = "branch", required = false) String branch,
            @org.springframework.web.bind.annotation.RequestParam(value = "sections", required = false) List<String> sections,
            @org.springframework.web.bind.annotation.RequestParam(value = "counselorUsername", required = false) String counselorUsername
    );
}
