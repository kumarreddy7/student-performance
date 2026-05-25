package com.varsha.studentservice.repository;

import com.varsha.studentservice.entity.CounselorOffDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CounselorOffDateRepository extends JpaRepository<CounselorOffDate, Long> {
    Optional<CounselorOffDate> findByCounselorUsernameAndDate(String counselorUsername, LocalDate date);
    List<CounselorOffDate> findByCounselorUsername(String counselorUsername);
}
