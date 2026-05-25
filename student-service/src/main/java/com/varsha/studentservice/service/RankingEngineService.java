package com.varsha.studentservice.service;

import com.varsha.studentservice.entity.Mark;
import com.varsha.studentservice.entity.Ranking;
import com.varsha.studentservice.entity.Student;
import com.varsha.studentservice.repository.MarkRepository;
import com.varsha.studentservice.repository.RankingRepository;
import com.varsha.studentservice.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class RankingEngineService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private MarkRepository markRepository;

    @Autowired
    private RankingRepository rankingRepository;

    @Transactional
    public void calculateRankings() {
        // Fetch all active students (not "Deleted")
        List<Student> activeStudents = studentRepository.findByStatusNot("Deleted");

        List<RankingCandidate> candidates = new ArrayList<>();

        for (Student student : activeStudents) {
            List<Mark> marks = markRepository.findByStudentId(student.getId());
            double totalMarks = 0.0;
            double percentage = 0.0;

            if (!marks.isEmpty()) {
                totalMarks = marks.stream().mapToDouble(Mark::getMarks).sum();
                // Assuming max marks per subject is 100.0, percentage is totalMarks / (number of subjects)
                percentage = totalMarks / marks.size();
            }

            candidates.add(new RankingCandidate(student.getId(), totalMarks, percentage));
        }

        // Sort candidates descending by totalMarks
        candidates.sort((c1, c2) -> Double.compare(c2.totalMarks, c1.totalMarks));

        Set<Long> rankedStudentIds = new HashSet<>();
        int currentRank = 1;
        double previousScore = -1.0;

        for (int i = 0; i < candidates.size(); i++) {
            RankingCandidate candidate = candidates.get(i);
            if (i > 0 && candidate.totalMarks < previousScore) {
                currentRank = i + 1;
            }
            previousScore = candidate.totalMarks;

            Ranking ranking = rankingRepository.findByStudentId(candidate.studentId)
                    .orElseGet(Ranking::new);
            ranking.setStudentId(candidate.studentId);
            ranking.setRank(currentRank);
            ranking.setTotalMarks(candidate.totalMarks);
            ranking.setPercentage(candidate.percentage);
            rankingRepository.save(ranking);
            rankedStudentIds.add(candidate.studentId);
        }

        // Remove rankings for students no longer active
        rankingRepository.findAll().stream()
                .filter(r -> !rankedStudentIds.contains(r.getStudentId()))
                .forEach(rankingRepository::delete);
    }

    private static class RankingCandidate {
        Long studentId;
        double totalMarks;
        double percentage;

        RankingCandidate(Long studentId, double totalMarks, double percentage) {
            this.studentId = studentId;
            this.totalMarks = totalMarks;
            this.percentage = percentage;
        }
    }
}
