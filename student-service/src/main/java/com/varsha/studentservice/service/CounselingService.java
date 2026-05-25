package com.varsha.studentservice.service;

import com.varsha.studentservice.entity.CounselingAppointment;
import com.varsha.studentservice.entity.CounselorOffDate;
import com.varsha.studentservice.exception.BadRequestException;
import com.varsha.studentservice.exception.ResourceNotFoundException;
import com.varsha.studentservice.repository.CounselingAppointmentRepository;
import com.varsha.studentservice.repository.CounselorOffDateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class CounselingService {

    @Autowired
    private CounselingAppointmentRepository appointmentRepository;

    @Autowired
    private CounselorOffDateRepository offDateRepository;

    private static final List<String> STANDARD_SLOTS = List.of(
            "09:00 - 10:00",
            "10:00 - 11:00",
            "11:00 - 12:00",
            "14:00 - 15:00",
            "15:00 - 16:00"
    );

    private boolean isSlotPast(String slot, LocalDate date) {
        java.time.ZonedDateTime now = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
        LocalDate today = now.toLocalDate();
        if (date.isBefore(today)) {
            return true;
        }
        if (date.isAfter(today)) {
            return false;
        }
        try {
            String startTimeStr = slot.substring(0, 5).trim();
            java.time.LocalTime slotStart = java.time.LocalTime.parse(startTimeStr);
            return now.toLocalTime().isAfter(slotStart);
        } catch (Exception e) {
            return false;
        }
    }

    public List<Map<String, Object>> getSlotsForDay(String counselorUsername, LocalDate date) {
        boolean isOff = offDateRepository.findByCounselorUsernameAndDate(counselorUsername, date).isPresent();
        List<CounselingAppointment> appointments = appointmentRepository.findByCounselorUsernameAndDate(counselorUsername, date);

        List<Map<String, Object>> result = new ArrayList<>();
        for (String slot : STANDARD_SLOTS) {
            Map<String, Object> map = new HashMap<>();
            map.put("timeSlot", slot);
            if (isOff) {
                map.put("status", "BLOCKED");
                map.put("reason", "No counselling hours for today");
            } else if (isSlotPast(slot, date)) {
                map.put("status", "BLOCKED");
                map.put("reason", "Past Hour");
            } else {
                Optional<CounselingAppointment> appOpt = appointments.stream()
                        .filter(a -> a.getTimeSlot().equals(slot))
                        .findFirst();
                if (appOpt.isPresent()) {
                    CounselingAppointment app = appOpt.get();
                    map.put("status", app.getStatus());
                    map.put("appointmentId", app.getId());
                    map.put("studentName", app.getStudentName());
                    map.put("studentId", app.getStudentId());
                    map.put("rejectionReason", app.getRejectionReason());
                } else {
                    map.put("status", "AVAILABLE");
                }
            }
            result.add(map);
        }
        return result;
    }

    @Transactional
    public CounselingAppointment bookAppointment(Long studentId, String studentName, String counselorUsername, LocalDate date, String timeSlot) {
        if (!STANDARD_SLOTS.contains(timeSlot)) {
            throw new BadRequestException("Invalid time slot requested.");
        }

        if (isSlotPast(timeSlot, date)) {
            throw new BadRequestException("This time slot has already passed.");
        }

        boolean isOff = offDateRepository.findByCounselorUsernameAndDate(counselorUsername, date).isPresent();
        if (isOff) {
            throw new BadRequestException("Counselor has declared no counselling hours for this date.");
        }

        Optional<CounselingAppointment> existing = appointmentRepository.findByCounselorUsernameAndDateAndTimeSlot(counselorUsername, date, timeSlot);
        if (existing.isPresent()) {
            String status = existing.get().getStatus();
            if ("PENDING".equals(status) || "ACCEPTED".equals(status)) {
                throw new BadRequestException("This time slot is already booked or requested.");
            }
            // If rejected before, we can allow re-booking
            appointmentRepository.delete(existing.get());
        }

        CounselingAppointment app = new CounselingAppointment();
        app.setStudentId(studentId);
        app.setStudentName(studentName);
        app.setCounselorUsername(counselorUsername);
        app.setDate(date);
        app.setTimeSlot(timeSlot);
        app.setStatus("PENDING");

        return appointmentRepository.save(app);
    }

    @Transactional
    public void acceptAppointment(Long id) {
        CounselingAppointment app = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));
        app.setStatus("ACCEPTED");
        app.setRejectionReason(null);
        appointmentRepository.save(app);
    }

    @Transactional
    public void rejectAppointment(Long id, String reason) {
        CounselingAppointment app = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));
        app.setStatus("REJECTED");
        app.setRejectionReason(reason);
        appointmentRepository.save(app);
    }

    @Transactional
    public void toggleOffDay(String counselorUsername, LocalDate date, boolean isOff) {
        Optional<CounselorOffDate> existing = offDateRepository.findByCounselorUsernameAndDate(counselorUsername, date);
        if (isOff) {
            if (!existing.isPresent()) {
                CounselorOffDate offDate = new CounselorOffDate();
                offDate.setCounselorUsername(counselorUsername);
                offDate.setDate(date);
                offDateRepository.save(offDate);

                // Auto-reject any pending appointments for this date
                List<CounselingAppointment> appointments = appointmentRepository.findByCounselorUsernameAndDate(counselorUsername, date);
                for (CounselingAppointment app : appointments) {
                    if ("PENDING".equals(app.getStatus())) {
                        app.setStatus("REJECTED");
                        app.setRejectionReason("No counselling hours for today");
                        appointmentRepository.save(app);
                    }
                }
            }
        } else {
            existing.ifPresent(counselorOffDate -> offDateRepository.delete(counselorOffDate));
        }
    }

    public boolean isCounselorOff(String counselorUsername, LocalDate date) {
        return offDateRepository.findByCounselorUsernameAndDate(counselorUsername, date).isPresent();
    }

    public List<CounselingAppointment> getStudentAppointments(Long studentId) {
        return appointmentRepository.findByStudentId(studentId);
    }

    public List<CounselingAppointment> getCounselorAppointments(String counselorUsername) {
        return appointmentRepository.findByCounselorUsername(counselorUsername);
    }

    public List<CounselingAppointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
}


