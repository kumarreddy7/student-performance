package com.varsha.studentperfomance.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.varsha.studentperfomance.entity.Student;
import com.varsha.studentperfomance.exception.BadRequestException;
import com.varsha.studentperfomance.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class CsvService {

    @Autowired
    private StudentRepository studentRepository;

    public String processStudentCsv(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Please select a CSV file to upload.");
        }

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));
             CSVReader csvReader = new CSVReader(fileReader)) {

            List<Student> studentsToSave = new ArrayList<>();
            String[] nextRecord;

            // Skip header
            csvReader.readNext();

            while ((nextRecord = csvReader.readNext()) != null) {
                // Expected format: firstName, lastName, email, enrollmentDate
                if (nextRecord.length < 4) {
                    continue; // Skip invalid rows
                }

                String firstName = nextRecord[0];
                String lastName = nextRecord[1];
                String email = nextRecord[2];
                String enrollmentDateStr = nextRecord[3];

                if (!studentRepository.existsByEmail(email)) {
                    Student student = new Student();
                    student.setFirstName(firstName);
                    student.setLastName(lastName);
                    student.setEmail(email);
                    
                    try {
                        student.setEnrollmentDate(LocalDate.parse(enrollmentDateStr));
                    } catch (Exception e) {
                        student.setEnrollmentDate(LocalDate.now());
                    }

                    studentsToSave.add(student);
                }
            }

            studentRepository.saveAll(studentsToSave);
            return "Successfully imported " + studentsToSave.size() + " new students.";

        } catch (Exception e) {
            throw new BadRequestException("Failed to parse CSV file: " + e.getMessage());
        }
    }
}
