package com.vitatrack.nutrition;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vitatrack.nutrition.dto.DailyNutritionSummary;
import com.vitatrack.nutrition.dto.DailyWaterSummary;
import com.vitatrack.nutrition.dto.FoodLogRequest;
import com.vitatrack.nutrition.dto.FoodLogResponse;
import com.vitatrack.nutrition.dto.WaterLogRequest;
import com.vitatrack.nutrition.dto.WaterLogResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
public class NutritionController {

    private final NutritionService nutritionService;

    @PostMapping("/log")
    public ResponseEntity<FoodLogResponse> addFoodLog(@Valid @RequestBody FoodLogRequest request) {
        return ResponseEntity.ok(nutritionService.createLog(request));
    }

    @GetMapping("/logs")
    public ResponseEntity<DailyNutritionSummary> getLogsByDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(nutritionService.getLogsByDate(date));
    }

    @DeleteMapping("/log/{id}")
    public ResponseEntity<Void> deleteFoodLog(@PathVariable Long id) {
        nutritionService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/water")
    public ResponseEntity<WaterLogResponse> addWaterLog(@Valid @RequestBody WaterLogRequest request) {
        return ResponseEntity.ok(nutritionService.createWaterLog(request));
    }

    @GetMapping("/water")
    public ResponseEntity<DailyWaterSummary> getWaterByDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(nutritionService.getWaterSummary(date));
    }
}
