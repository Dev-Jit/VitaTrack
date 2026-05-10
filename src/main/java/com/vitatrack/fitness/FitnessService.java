package com.vitatrack.fitness;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.vitatrack.fitness.dto.ExerciseLogRequest;
import com.vitatrack.fitness.dto.ExerciseLogResponse;
import com.vitatrack.user.User;
import com.vitatrack.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FitnessService {

    private final ExerciseLogRepository exerciseLogRepository;
    private final UserRepository userRepository;

    public ExerciseLogResponse createLog(ExerciseLogRequest request) {
        User user = getCurrentUser();

        ExerciseLog saved = exerciseLogRepository.save(ExerciseLog.builder()
                .user(user)
                .exerciseName(request.getExerciseName())
                .category(request.getCategory())
                .durationMinutes(request.getDurationMinutes())
                .caloriesBurned(request.getCaloriesBurned())
                .notes(request.getNotes())
                .logDate(request.getLogDate())
                .build());

        return toResponse(saved);
    }

    public List<ExerciseLogResponse> getLogsByDate(LocalDate date) {
        User user = getCurrentUser();
        return exerciseLogRepository.findByUserAndLogDateOrderByIdDesc(user, date)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ExerciseLogResponse> getHistory(LocalDate startDate, LocalDate endDate) {
        User user = getCurrentUser();
        return exerciseLogRepository.findByUserAndLogDateBetweenOrderByLogDateDescIdDesc(user, startDate, endDate)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteLog(Long id) {
        User user = getCurrentUser();
        ExerciseLog log = exerciseLogRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Exercise log not found"));
        exerciseLogRepository.delete(log);
    }

    private ExerciseLogResponse toResponse(ExerciseLog log) {
        return ExerciseLogResponse.builder()
                .id(log.getId())
                .exerciseName(log.getExerciseName())
                .category(log.getCategory())
                .durationMinutes(log.getDurationMinutes())
                .caloriesBurned(log.getCaloriesBurned())
                .notes(log.getNotes())
                .logDate(log.getLogDate())
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Unauthorized"));
    }
}
