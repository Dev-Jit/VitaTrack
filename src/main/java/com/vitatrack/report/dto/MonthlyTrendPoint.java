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
public class MonthlyTrendPoint {
    private LocalDate date;
    private Double caloriesConsumed;
    private Integer caloriesBurned;
    private Integer waterIntakeMl;
    private Double weightKg;
    private Double sleepHoursAvg;
}
