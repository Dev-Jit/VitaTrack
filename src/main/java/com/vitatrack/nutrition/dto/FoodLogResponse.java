package com.vitatrack.nutrition.dto;

import java.time.LocalDate;

import com.vitatrack.nutrition.MealType;

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
public class FoodLogResponse {
    private Long id;
    private Long foodItemId;
    private String foodName;
    private String brand;
    private MealType mealType;
    private Double quantity;
    private LocalDate logDate;
    private Double calories;
    private Double protein;
    private Double carbs;
    private Double fat;
    private Double fiber;
}
