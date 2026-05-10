package com.vitatrack.goal.dto;

import java.time.LocalDate;

import com.vitatrack.goal.GoalStatus;
import com.vitatrack.goal.GoalType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class GoalRequest {

    @NotNull(message = "goalType is required")
    private GoalType goalType;

    @NotNull(message = "targetValue is required")
    private Double targetValue;

    @NotNull(message = "currentValue is required")
    private Double currentValue;

    @NotBlank(message = "unit is required")
    private String unit;

    @NotNull(message = "startDate is required")
    private LocalDate startDate;

    @NotNull(message = "targetDate is required")
    private LocalDate targetDate;

    @NotNull(message = "status is required")
    private GoalStatus status;
}
