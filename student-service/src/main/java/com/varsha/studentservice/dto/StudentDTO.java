package com.varsha.studentservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentDTO {
    private Long id;

    @NotBlank(message = "First name is mandatory")
    private String firstName;

    @NotBlank(message = "Last name is mandatory")
    private String lastName;

    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Roll number is mandatory")
    private String rollNumber;

    @NotBlank(message = "Class is mandatory")
    private String className;

    @NotBlank(message = "Section is mandatory")
    private String section;

    @NotBlank(message = "Branch is mandatory")
    private String branch;

    private String phoneNumber;
    private String status;
    private String counselorUsername;

    private LocalDate enrollmentDate;
    private Long userId;
}
