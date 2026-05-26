package com.varsha.studentservice.repository;

import com.varsha.studentservice.entity.TeacherClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TeacherClassRepository extends JpaRepository<TeacherClass, Long> {
    List<TeacherClass> findByTeacherEmail(String teacherEmail);
}
