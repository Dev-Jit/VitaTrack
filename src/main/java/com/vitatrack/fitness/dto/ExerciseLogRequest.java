package com.vitatrack.fitness.dto;

import java.time.LocalDate;

import com.vitatrack.fitness.ExerciseCategory;

import jakarta.validation.constraints.Min;
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
public class ExerciseLogRequest {

    @NotBlank(message = "exerciseName is required")
    private String exerciseName;

    @NotNull(message = "category is required")
    private ExerciseCategory category;

    @NotNull(message = "durationMinutes is required")
    @Min(value = 1, message = "durationMinutes must be at least 1")
    private Integer durationMinutes;

    @NotNull(message = "caloriesBurned is required")
    @Min(value = 0, message = "caloriesBurned cannot be negative")
    private Integer caloriesBurned;

    private String notes;

    @NotNull(message = "logDate is required")
    private LocalDate logDate;
}
