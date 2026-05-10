package com.vitatrack.nutrition.dto;

import java.time.LocalDate;

import com.vitatrack.nutrition.MealType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class FoodLogRequest {

    @NotNull(message = "foodItemId is required")
    private Long foodItemId;

    @NotNull(message = "mealType is required")
    private MealType mealType;

    @NotNull(message = "quantity is required")
    @Positive(message = "quantity must be positive")
    private Double quantity;

    @NotNull(message = "logDate is required")
    private LocalDate logDate;
}
