package com.varsha.analyticsservice.client;

import com.varsha.analyticsservice.dto.StudentDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@FeignClient(name = "student-service")
public interface StudentServiceClient {

    @GetMapping("/api/students/{id}")
    StudentDTO getStudentById(@RequestHeader("Authorization") String token, @PathVariable("id") Long id);

    @GetMapping("/api/students")
    List<StudentDTO> getAllStudents(@RequestHeader("Authorization") String token);

    @GetMapping("/api/students/{id}/assignments")
    List<com.varsha.analyticsservice.dto.AssignmentMarkDTO> getAssignments(@RequestHeader("Authorization") String token, @PathVariable("id") Long id);

    @GetMapping("/api/students/{id}/performance")
    com.varsha.analyticsservice.dto.StudentPerformanceDTO getStudentPerformance(@RequestHeader("Authorization") String token, @PathVariable("id") Long id);
}
