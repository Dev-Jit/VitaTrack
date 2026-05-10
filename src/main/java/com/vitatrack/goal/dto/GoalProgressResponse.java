package com.vitatrack.goal.dto;

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
public class GoalProgressResponse {
    private Long goalId;
    private Double currentValue;
    private Double targetValue;
    private Double completionPercent;
    private String unit;
}
