package com.vitatrack.goal.dto;

import java.time.LocalDate;

import com.vitatrack.goal.GoalStatus;
import com.vitatrack.goal.GoalType;

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
public class GoalResponse {
    private Long id;
    private GoalType goalType;
    private Double targetValue;
    private Double currentValue;
    private String unit;
    private LocalDate startDate;
    private LocalDate targetDate;
    private GoalStatus status;
}
