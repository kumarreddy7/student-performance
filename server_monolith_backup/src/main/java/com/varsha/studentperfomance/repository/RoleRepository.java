package com.varsha.studentperfomance.repository;

import com.varsha.studentperfomance.entity.ERole;
import com.varsha.studentperfomance.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(ERole name);
}
