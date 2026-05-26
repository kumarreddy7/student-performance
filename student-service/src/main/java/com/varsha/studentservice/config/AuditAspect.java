package com.varsha.studentservice.config;

import com.varsha.studentservice.entity.AuditLog;
import com.varsha.studentservice.entity.Student;
import com.varsha.studentservice.repository.AuditLogRepository;
import com.varsha.studentservice.repository.StudentRepository;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Aspect
@Component
public class AuditAspect {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Before("execution(* com.varsha.studentservice.controller.StudentController.getStudentById(..)) && args(id)")
    public void logProfileView(JoinPoint joinPoint, Long id) {
        logAudit(id, "VIEW_PROFILE");
    }

    @Before("execution(* com.varsha.studentservice.controller.StudentController.getStudentPerformance(..)) && args(id)")
    public void logPerformanceView(JoinPoint joinPoint, Long id) {
        logAudit(id, "VIEW_PERFORMANCE");
    }

    private void logAudit(Long studentId, String action) {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                String viewer = auth.getName();
                
                Student student = studentRepository.findById(studentId).orElse(null);
                if (student != null) {
                    AuditLog log = new AuditLog();
                    log.setViewerEmail(viewer);
                    log.setStudentId(studentId);
                    log.setStudentName(student.getFirstName() + " " + student.getLastName());
                    log.setViewAction(action);
                    log.setTimestamp(LocalDateTime.now());
                    
                    auditLogRepository.save(log);
                }
            }
        } catch (Exception e) {
            // Fail-safe: prevent logging failure from blocking student details load
        }
    }
}
