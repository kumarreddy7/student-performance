package com.varsha.studentservice.repository;

import com.varsha.studentservice.entity.Ranking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface RankingRepository extends JpaRepository<Ranking, Long> {
    Optional<Ranking> findByStudentId(Long studentId);
    List<Ranking> findAllByOrderByRankAsc();
    void deleteByStudentId(Long studentId);
}
