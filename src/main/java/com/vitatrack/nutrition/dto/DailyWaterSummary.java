package com.vitatrack.nutrition.dto;

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
public class DailyWaterSummary {
    private LocalDate date;
    private Integer totalMl;
    private Integer dailyGoalMl;
}
