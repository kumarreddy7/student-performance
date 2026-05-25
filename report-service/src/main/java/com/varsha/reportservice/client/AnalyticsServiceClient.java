package com.varsha.reportservice.client;

import com.varsha.reportservice.dto.PerformanceRecordDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;
import java.util.Map;

@FeignClient(name = "analytics-service")
public interface AnalyticsServiceClient {

    @GetMapping("/api/analytics/dashboard/summary")
    Map<String, Object> getDashboardSummary(@RequestHeader("Authorization") String token);
}
