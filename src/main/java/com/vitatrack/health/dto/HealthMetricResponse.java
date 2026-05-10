package com.vitatrack.health.dto;

import java.time.LocalDateTime;

import com.vitatrack.health.MetricType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthMetricResponse {
    private Long id;
    private MetricType metricType;
    private Double value;
    private String unit;
    private LocalDateTime recordedAt;
    private String notes;
}
