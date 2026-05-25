package com.varsha.studentservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import java.util.Map;

@FeignClient(name = "auth-service")
public interface AuthServiceClient {
    @GetMapping("/api/auth/users/count")
    Map<String, Long> getUserCounts(@RequestHeader("Authorization") String token);

    @PostMapping("/api/auth/register")
    Map<String, Object> registerUser(@RequestBody Map<String, String> signUpRequest);
}
