package com.varsha.studentservice.service;

import com.opencsv.CSVReader;
import com.varsha.studentservice.entity.CsvUpload;
import com.varsha.studentservice.entity.Mark;
import com.varsha.studentservice.entity.Student;
import com.varsha.studentservice.exception.BadRequestException;
import com.varsha.studentservice.repository.CsvUploadRepository;
import com.varsha.studentservice.repository.MarkRepository;
import com.varsha.studentservice.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CsvService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private MarkRepository markRepository;

    @Autowired
    private CsvUploadRepository csvUploadRepository;

    @Autowired
    private RankingEngineService rankingEngineService;

    @Autowired
    private DataCleansingService dataCleansingService;

    @Transactional
    public String processStudentCsv(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Please select a CSV file to upload.");
        }

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));
             CSVReader csvReader = new CSVReader(fileReader)) {

            String[] headers = csvReader.readNext();
            if (headers == null) {
                throw new BadRequestException("CSV file is empty or missing headers");
            }

            int rollIdx = -1;
            int nameIdx = -1;
            int firstNameIdx = -1;
            int lastNameIdx = -1;
            int emailIdx = -1;
            int classIdx = -1;
            int sectionIdx = -1;
            int phoneIdx = -1;
            int enrollmentDateIdx = -1;

            for (int i = 0; i < headers.length; i++) {
                String h = headers[i].trim().toLowerCase();
                if (h.contains("roll")) {
                    rollIdx = i;
                } else if (h.equals("name") || h.contains("student name") || h.contains("full name")) {
                    nameIdx = i;
                } else if (h.contains("first")) {
                    firstNameIdx = i;
                } else if (h.contains("last")) {
                    lastNameIdx = i;
                } else if (h.equals("email") || h.contains("email")) {
                    emailIdx = i;
                } else if (h.equals("class") || h.contains("class")) {
                    classIdx = i;
                } else if (h.equals("section")) {
                    sectionIdx = i;
                } else if (h.contains("phone")) {
                    phoneIdx = i;
                } else if (h.contains("enrollment")) {
                    enrollmentDateIdx = i;
                }
            }

            // Fallback for simple/unmapped headers to maintain backward compatibility
            if (emailIdx == -1 && headers.length > 2) {
                firstNameIdx = 0;
                lastNameIdx = 1;
                emailIdx = 2;
                if (headers.length > 3) {
                    enrollmentDateIdx = 3;
                }
            }

            if (emailIdx == -1) {
                throw new BadRequestException("Required column 'Email' not found in CSV headers.");
            }

            List<Student> studentsToSave = new ArrayList<>();
            String[] nextRecord;
            int rowCount = 0;

            while ((nextRecord = csvReader.readNext()) != null) {
                if (nextRecord.length <= emailIdx) {
                    continue; // Skip invalid row
                }

                String email = nextRecord[emailIdx].trim();
                if (email.isEmpty()) {
                    continue;
                }

                String rollNumber = rollIdx != -1 && nextRecord.length > rollIdx ? nextRecord[rollIdx].trim() : "";
                String firstName = "";
                String lastName = "";

                if (nameIdx != -1 && nextRecord.length > nameIdx) {
                    String fullName = nextRecord[nameIdx].trim();
                    String[] parts = fullName.split("\\s+", 2);
                    firstName = parts[0];
                    if (parts.length > 1) {
                        lastName = parts[1];
                    } else {
                        lastName = "-";
                    }
                } else {
                    if (firstNameIdx != -1 && nextRecord.length > firstNameIdx) {
                        firstName = nextRecord[firstNameIdx].trim();
                    }
                    if (lastNameIdx != -1 && nextRecord.length > lastNameIdx) {
                        lastName = nextRecord[lastNameIdx].trim();
                    }
                }

                String className = classIdx != -1 && nextRecord.length > classIdx ? nextRecord[classIdx].trim() : "Default Class";
                String section = sectionIdx != -1 && nextRecord.length > sectionIdx ? nextRecord[sectionIdx].trim() : "A";
                String phoneNumber = phoneIdx != -1 && nextRecord.length > phoneIdx ? nextRecord[phoneIdx].trim() : "";
                LocalDate enrollmentDate = LocalDate.now();

                if (enrollmentDateIdx != -1 && nextRecord.length > enrollmentDateIdx) {
                    try {
                        enrollmentDate = LocalDate.parse(nextRecord[enrollmentDateIdx].trim());
                    } catch (Exception e) {
                        // ignore and use default now()
                    }
                }

                // Make sure roll number is present & unique
                if (rollNumber.isEmpty()) {
                    String baseRoll = "ROLL_" + email.split("@")[0].toUpperCase();
                    rollNumber = baseRoll;
                    int counter = 1;
                    while (studentRepository.existsByRollNumber(rollNumber)) {
                        rollNumber = baseRoll + "_" + counter;
                        counter++;
                    }
                }

                // Check if student exists by Email or Roll Number
                Optional<Student> existingOpt = studentRepository.findByEmail(email);
                if (!existingOpt.isPresent() && !rollNumber.isEmpty()) {
                    existingOpt = studentRepository.findByRollNumber(rollNumber);
                }

                Student student;
                if (existingOpt.isPresent()) {
                    student = existingOpt.get();
                    if ("Deleted".equals(student.getStatus())) {
                        student.setStatus("Active");
                    }
                } else {
                    student = new Student();
                }

                student.setFirstName(firstName);
                student.setLastName(lastName);
                student.setEmail(email);
                student.setRollNumber(rollNumber);
                student.setClassName(className);
                student.setSection(section);
                student.setPhoneNumber(phoneNumber);
                student.setEnrollmentDate(enrollmentDate);

                studentsToSave.add(student);
                rowCount++;
            }

            studentRepository.saveAll(studentsToSave);

            // Log upload
            CsvUpload uploadLog = new CsvUpload();
            uploadLog.setFileName(file.getOriginalFilename());
            uploadLog.setUploadDate(LocalDateTime.now());
            uploadLog.setFileType("STUDENT");
            uploadLog.setData(file.getBytes());

            String username = "System";
            try {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getName() != null) {
                    username = auth.getName();
                }
            } catch (Exception e) {
                // fallback
            }
            uploadLog.setUploadedBy(username);
            csvUploadRepository.save(uploadLog);

            // Recalculate rankings in case new students or updated roll numbers affect it
            rankingEngineService.calculateRankings();

            return "Successfully processed Student CSV. Imported/Updated " + rowCount + " student records.";

        } catch (Exception e) {
            throw new BadRequestException("Failed to parse CSV file: " + e.getMessage());
        }
    }

    @Transactional
    public String processMarksCsv(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Please select a CSV file to upload.");
        }

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));
             CSVReader csvReader = new CSVReader(fileReader)) {

            String[] headers = csvReader.readNext();
            if (headers == null) {
                throw new BadRequestException("CSV file is empty or missing headers");
            }

            int rollIdx = -1;
            int subjectIdx = -1;
            int marksIdx = -1;

            for (int i = 0; i < headers.length; i++) {
                String h = headers[i].trim().toLowerCase();
                if (h.contains("roll")) {
                    rollIdx = i;
                } else if (h.contains("subject")) {
                    subjectIdx = i;
                } else if (h.contains("mark") || h.contains("score")) {
                    marksIdx = i;
                }
            }

            if (rollIdx == -1 || subjectIdx == -1 || marksIdx == -1) {
                throw new BadRequestException("Required columns ('Roll Number', 'Subject', 'Marks') not found in CSV headers.");
            }

            String[] nextRecord;
            int importedCount = 0;
            int skippedCount = 0;

            while ((nextRecord = csvReader.readNext()) != null) {
                if (nextRecord.length <= Math.max(rollIdx, Math.max(subjectIdx, marksIdx))) {
                    continue;
                }

                String rollNumber = nextRecord[rollIdx].trim();
                String subject = nextRecord[subjectIdx].trim();
                String marksStr = nextRecord[marksIdx].trim();

                if (rollNumber.isEmpty() || subject.isEmpty()) {
                    skippedCount++;
                    continue;
                }

                double marksVal;
                if (marksStr.isEmpty()) {
                    marksVal = dataCleansingService.getSubjectClassAverage(subject);
                } else {
                    try {
                        marksVal = Double.parseDouble(marksStr);
                    } catch (Exception e) {
                        marksVal = dataCleansingService.getSubjectClassAverage(subject);
                    }
                }

                Optional<Student> studentOpt = studentRepository.findByRollNumber(rollNumber);
                if (studentOpt.isPresent() && !"Deleted".equals(studentOpt.get().getStatus())) {
                    Student student = studentOpt.get();
                    
                    Optional<Mark> markOpt = markRepository.findByStudentIdAndSubject(student.getId(), subject);
                    Mark mark;
                    if (markOpt.isPresent()) {
                        mark = markOpt.get();
                    } else {
                        mark = new Mark();
                        mark.setStudentId(student.getId());
                        mark.setSubject(subject);
                    }
                    mark.setMarks(marksVal);
                    markRepository.save(mark);
                    importedCount++;
                } else {
                    skippedCount++;
                }
            }

            // Log upload
            CsvUpload uploadLog = new CsvUpload();
            uploadLog.setFileName(file.getOriginalFilename());
            uploadLog.setUploadDate(LocalDateTime.now());
            uploadLog.setFileType("MARKS");
            uploadLog.setData(file.getBytes());

            String username = "System";
            try {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getName() != null) {
                    username = auth.getName();
                }
            } catch (Exception e) {
                // fallback
            }
            uploadLog.setUploadedBy(username);
            csvUploadRepository.save(uploadLog);

            // Trigger rank recalculation
            rankingEngineService.calculateRankings();

            return "Successfully processed Marks CSV. Imported/Updated " + importedCount + " marks. Skipped " + skippedCount + " records.";

        } catch (Exception e) {
            throw new BadRequestException("Failed to parse CSV file: " + e.getMessage());
        }
    }
}
