package com.vitatrack.report.dto;

import java.util.List;

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
public class MonthlyReportResponse {
    private Integer month;
    private Integer year;
    private Double totalCaloriesConsumed;
    private Integer totalCaloriesBurned;
    private Integer totalWaterIntakeMl;
    private Double averageCaloriesConsumed;
    private Double averageCaloriesBurned;
    private Double averageWaterIntakeMl;
    private List<MonthlyTrendPoint> trends;
}
