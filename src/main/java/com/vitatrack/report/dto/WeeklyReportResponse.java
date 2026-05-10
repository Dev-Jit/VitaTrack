package com.vitatrack.report.dto;

import java.time.LocalDate;

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
public class WeeklyReportResponse {
    private LocalDate startDate;
    private LocalDate endDate;
    private Double totalCaloriesConsumed;
    private Integer totalCaloriesBurned;
    private Integer totalWaterIntakeMl;
    private Double averageCaloriesConsumed;
    private Double averageCaloriesBurned;
    private Double averageWaterIntakeMl;
}
