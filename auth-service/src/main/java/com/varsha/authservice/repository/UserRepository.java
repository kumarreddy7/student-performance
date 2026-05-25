package com.varsha.authservice.repository;

import com.varsha.authservice.entity.User;
import com.varsha.authservice.entity.ERole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    long countByRoleName(ERole roleName);
    List<User> findByBranchAndIsHodTrue(String branch);
}
