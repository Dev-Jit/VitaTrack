package com.vitatrack.report.dto;

import java.time.LocalDate;
import java.util.List;

import com.vitatrack.health.dto.HealthMetricResponse;

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
public class DailyReportResponse {
    private LocalDate date;
    private Double caloriesConsumed;
    private Double protein;
    private Double carbs;
    private Double fat;
    private Double fiber;
    private Integer caloriesBurned;
    private Integer exerciseMinutes;
    private Integer waterIntakeMl;
    private List<HealthMetricResponse> healthMetrics;
}
