package com.varsha.analyticsservice.repository;

import com.varsha.analyticsservice.document.RiskConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RiskConfigRepository extends MongoRepository<RiskConfig, String> {
}
