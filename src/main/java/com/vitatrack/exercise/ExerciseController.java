package com.vitatrack.exercise;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vitatrack.fitness.dto.ExerciseLogResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseRecommendationService exerciseRecommendationService;

    @GetMapping("/recommended")
    public ResponseEntity<List<Exercise>> getRecommended() {
        Long userId = exerciseRecommendationService.getCurrentUserId();
        return ResponseEntity.ok(exerciseRecommendationService.getRecommended(userId));
    }

    @GetMapping("/daily-plan")
    public ResponseEntity<List<Exercise>> getDailyPlan() {
        Long userId = exerciseRecommendationService.getCurrentUserId();
        return ResponseEntity.ok(exerciseRecommendationService.getDailyPlan(userId));
    }

    @PostMapping("/log/{id}")
    public ResponseEntity<ExerciseLogResponse> logExercise(@PathVariable("id") Long exerciseId) {
        Long userId = exerciseRecommendationService.getCurrentUserId();
        return ResponseEntity.ok(exerciseRecommendationService.logExerciseById(userId, exerciseId));
    }
}

