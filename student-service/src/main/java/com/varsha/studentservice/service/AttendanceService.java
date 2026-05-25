package com.varsha.studentservice.service;

import com.varsha.studentservice.dto.AttendanceDTO;
import com.varsha.studentservice.dto.AttendanceRecordDTO;
import com.varsha.studentservice.dto.AttendanceStatsDTO;
import com.varsha.studentservice.entity.Attendance;
import com.varsha.studentservice.entity.Student;
import com.varsha.studentservice.repository.AttendanceRepository;
import com.varsha.studentservice.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Transactional
    public void saveAttendance(LocalDate date, List<AttendanceDTO> attendanceList, String markedBy) {
        for (AttendanceDTO dto : attendanceList) {
            Optional<Attendance> existing = attendanceRepository.findByStudentIdAndDate(dto.getStudentId(), date);
            Attendance attendance;
            if (existing.isPresent()) {
                attendance = existing.get();
                attendance.setStatus(dto.getStatus());
                attendance.setMarkedBy(markedBy);
            } else {
                attendance = new Attendance();
                attendance.setStudentId(dto.getStudentId());
                attendance.setDate(date);
                attendance.setStatus(dto.getStatus());
                attendance.setMarkedBy(markedBy);
            }
            attendanceRepository.save(attendance);
        }
    }

    public List<AttendanceRecordDTO> getAttendanceByDate(LocalDate date) {
        List<Student> activeStudents = studentRepository.findByStatusNot("Deleted");
        List<Attendance> attendanceList = attendanceRepository.findByDate(date);
        
        Map<Long, Attendance> attendanceMap = attendanceList.stream()
                .collect(Collectors.toMap(Attendance::getStudentId, att -> att, (s1, s2) -> s1));

        List<Student> displayStudents = new ArrayList<>(activeStudents);
        Set<Long> activeStudentIds = activeStudents.stream().map(Student::getId).collect(Collectors.toSet());

        for (Attendance att : attendanceList) {
            if (!activeStudentIds.contains(att.getStudentId())) {
                studentRepository.findById(att.getStudentId()).ifPresent(displayStudents::add);
            }
        }

        return displayStudents.stream().map(student -> {
            AttendanceRecordDTO dto = new AttendanceRecordDTO();
            dto.setStudentId(student.getId());
            dto.setFirstName(student.getFirstName());
            dto.setLastName(student.getLastName());
            dto.setEmail(student.getEmail());
            dto.setRollNumber(student.getRollNumber());
            dto.setClassName(student.getClassName());
            dto.setSection(student.getSection());
            dto.setBranch(student.getBranch());
            Attendance att = attendanceMap.get(student.getId());
            dto.setStatus(att != null ? att.getStatus() : null);
            dto.setMarkedBy(att != null ? att.getMarkedBy() : null);
            return dto;
        }).collect(Collectors.toList());
    }

    public AttendanceStatsDTO getAttendanceStats(LocalDate date) {
        // Daily stats
        long dayTotal = studentRepository.findByStatusNot("Deleted").size();
        long dayPresent = attendanceRepository.countByDateAndStatus(date, "PRESENT");
        double dayPercentage = dayTotal > 0 ? ((double) dayPresent / dayTotal) * 100.0 : 0.0;

        // Monthly stats
        LocalDate startOfMonth = date.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate endOfMonth = date.with(TemporalAdjusters.lastDayOfMonth());
        
        long monthPresent = attendanceRepository.countByDateBetweenAndStatus(startOfMonth, endOfMonth, "PRESENT");
        long monthTotal = attendanceRepository.countByDateBetween(startOfMonth, endOfMonth);
        double monthPercentage = monthTotal > 0 ? ((double) monthPresent / monthTotal) * 100.0 : 0.0;

        return new AttendanceStatsDTO(dayPresent, dayTotal, dayPercentage, monthPresent, monthTotal, monthPercentage);
    }
}
