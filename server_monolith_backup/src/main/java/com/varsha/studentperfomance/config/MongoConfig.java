package com.varsha.studentperfomance.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoRepositories(basePackages = "com.varsha.studentperfomance.repository.mongo")
public class MongoConfig {
    // Basic config for now, connection is handled via application.yml
}
