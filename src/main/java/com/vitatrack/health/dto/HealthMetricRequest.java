package com.vitatrack.health.dto;

import java.time.LocalDateTime;

import com.vitatrack.health.MetricType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
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
public class HealthMetricRequest {

    @NotNull(message = "metricType is required")
    private MetricType metricType;

    @NotNull(message = "value is required")
    private Double value;

    @NotBlank(message = "unit is required")
    private String unit;

    @NotNull(message = "recordedAt is required")
    @PastOrPresent(message = "recordedAt cannot be in the future")
    private LocalDateTime recordedAt;

    private String notes;
}
