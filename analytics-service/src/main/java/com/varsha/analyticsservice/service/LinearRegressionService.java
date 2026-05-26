package com.varsha.analyticsservice.service;

import com.varsha.analyticsservice.dto.AssignmentMarkDTO;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LinearRegressionService {

    private static final Pattern ASSIGNMENT_NUM_PATTERN = Pattern.compile("\\d+");

    /**
     * Projects a student's final grade in a subject based on their assignments.
     * Uses simple least-squares linear regression (y = mx + c).
     * If the student has less than 3 assignments, returns the arithmetic average of their marks as fallback.
     * Capped between 0.0 and 100.0.
     */
    public double projectFinalGrade(List<AssignmentMarkDTO> assignments) {
        if (assignments == null || assignments.isEmpty()) {
            return 60.0; // standard fallback
        }

        List<Double> xValues = new ArrayList<>();
        List<Double> yValues = new ArrayList<>();

        for (AssignmentMarkDTO assignment : assignments) {
            double assignmentNum = extractAssignmentNumber(assignment.getAssignmentName());
            xValues.add(assignmentNum);
            yValues.add(assignment.getMarks());
        }

        int n = xValues.size();
        if (n < 3) {
            // Arithmetic average fallback if not enough assignments exist for trend analysis
            double sum = 0.0;
            for (double val : yValues) {
                sum += val;
            }
            return Math.round((sum / n) * 100.0) / 100.0;
        }

        double sumX = 0.0;
        double sumY = 0.0;
        double sumXY = 0.0;
        double sumXX = 0.0;

        for (int i = 0; i < n; i++) {
            double x = xValues.get(i);
            double y = yValues.get(i);
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }

        double denominator = n * sumXX - (sumX * sumX);
        double m = 0.0;
        double c = 0.0;

        if (Math.abs(denominator) > 1e-6) {
            m = (n * sumXY - sumX * sumY) / denominator;
            c = (sumY - m * sumX) / n;
        } else {
            // Fallback to simple average if x values are singular/collinear (e.g. same assignment index repeated)
            return Math.round((sumY / n) * 100.0) / 100.0;
        }

        // Project the final grade at assignment index x = 5 (representing final assignment milestones)
        double predicted = (m * 5.0) + c;
        predicted = Math.max(0.0, Math.min(100.0, predicted)); // Cap between 0 and 100

        return Math.round(predicted * 100.0) / 100.0;
    }

    private double extractAssignmentNumber(String name) {
        if (name == null || name.isEmpty()) {
            return 1.0;
        }
        Matcher matcher = ASSIGNMENT_NUM_PATTERN.matcher(name);
        if (matcher.find()) {
            try {
                return Double.parseDouble(matcher.group());
            } catch (Exception e) {
                // fallback
            }
        }
        return 1.0;
    }
}
