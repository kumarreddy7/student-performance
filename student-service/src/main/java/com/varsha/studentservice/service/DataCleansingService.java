package com.varsha.studentservice.service;

import com.varsha.studentservice.repository.MarkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DataCleansingService {

    @Autowired
    private MarkRepository markRepository;

    /**
     * Retrieves the average grade of all students for a given subject.
     * If no records exist for the subject, returns a fallback default (e.g., 60.0).
     * Used for resolving missing or null academic grade points.
     */
    public double getSubjectClassAverage(String subject) {
        if (subject == null || subject.trim().isEmpty()) {
            return 60.0;
        }
        Double average = markRepository.findAverageMarksBySubject(subject.trim());
        return (average != null) ? Math.round(average * 100.0) / 100.0 : 60.0;
    }
}
