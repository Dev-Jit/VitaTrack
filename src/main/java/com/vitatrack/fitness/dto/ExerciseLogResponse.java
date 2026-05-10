package com.vitatrack.fitness.dto;

import java.time.LocalDate;

import com.vitatrack.fitness.ExerciseCategory;

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
public class ExerciseLogResponse {
    private Long id;
    private String exerciseName;
    private ExerciseCategory category;
    private Integer durationMinutes;
    private Integer caloriesBurned;
    private String notes;
    private LocalDate logDate;
}
