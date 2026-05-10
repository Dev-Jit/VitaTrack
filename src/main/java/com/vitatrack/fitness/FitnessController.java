package com.vitatrack.fitness;

import java.time.LocalDate;
import java.util.List;

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

import com.vitatrack.fitness.dto.ExerciseLogRequest;
import com.vitatrack.fitness.dto.ExerciseLogResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/fitness")
@RequiredArgsConstructor
public class FitnessController {

    private final FitnessService fitnessService;

    @PostMapping("/log")
    public ResponseEntity<ExerciseLogResponse> addLog(@Valid @RequestBody ExerciseLogRequest request) {
        return ResponseEntity.ok(fitnessService.createLog(request));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<ExerciseLogResponse>> getLogsByDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(fitnessService.getLogsByDate(date));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ExerciseLogResponse>> getHistory(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(fitnessService.getHistory(startDate, endDate));
    }

    @DeleteMapping("/log/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        fitnessService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }
}
