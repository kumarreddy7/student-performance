package com.varsha.studentservice.repository;

import com.varsha.studentservice.entity.CounselingAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CounselingAppointmentRepository extends JpaRepository<CounselingAppointment, Long> {
    List<CounselingAppointment> findByStudentId(Long studentId);
    List<CounselingAppointment> findByCounselorUsername(String counselorUsername);
    List<CounselingAppointment> findByCounselorUsernameAndDate(String counselorUsername, LocalDate date);
    Optional<CounselingAppointment> findByCounselorUsernameAndDateAndTimeSlot(String counselorUsername, LocalDate date, String timeSlot);
}
