package com.vitatrack.health;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vitatrack.health.dto.HealthMetricRequest;
import com.vitatrack.health.dto.HealthMetricResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final HealthService healthService;

    @PostMapping("/metric")
    public ResponseEntity<HealthMetricResponse> addMetric(@Valid @RequestBody HealthMetricRequest request) {
        return ResponseEntity.ok(healthService.createMetric(request));
    }

    @GetMapping("/metrics")
    public ResponseEntity<List<HealthMetricResponse>> getMetrics(
            @RequestParam(value = "type", required = false) MetricType type,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(healthService.getMetrics(type, startDate, endDate));
    }
}
