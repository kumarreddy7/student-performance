package com.varsha.studentservice.repository;

import com.varsha.studentservice.entity.CsvUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CsvUploadRepository extends JpaRepository<CsvUpload, Long> {
    List<CsvUpload> findTop5ByOrderByUploadDateDesc();
}
