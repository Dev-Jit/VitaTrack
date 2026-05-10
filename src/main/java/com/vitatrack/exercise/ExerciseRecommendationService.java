package com.vitatrack.exercise;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.vitatrack.fitness.ExerciseLog;
import com.vitatrack.fitness.ExerciseLogRepository;
import com.vitatrack.fitness.dto.ExerciseLogResponse;
import com.vitatrack.goal.Goal;
import com.vitatrack.goal.GoalRepository;
import com.vitatrack.goal.GoalStatus;
import com.vitatrack.goal.GoalType;
import com.vitatrack.user.User;
import com.vitatrack.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExerciseRecommendationService {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseLogRepository exerciseLogRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public ExerciseDifficulty getFitnessLevel(Long userId) {
        long count = exerciseLogRepository.countByUserId(userId);
        if (count <= 5) {
            return ExerciseDifficulty.BEGINNER;
        }
        if (count <= 20) {
            return ExerciseDifficulty.INTERMEDIATE;
        }
        return ExerciseDifficulty.ADVANCED;
    }

    public List<Exercise> getRecommended(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Unauthorized"));

        Set<ExerciseCategory> categories = deriveGoalCategories(user);
        ExerciseDifficulty level = getFitnessLevel(userId);

        List<Exercise> pool = new ArrayList<>();
        for (ExerciseCategory category : categories) {
            pool.addAll(exerciseRepository.findByCategoryAndDifficulty(category, level));
        }

        if (pool.size() < 10) {
            for (ExerciseCategory category : categories) {
                pool.addAll(exerciseRepository.findByCategory(category));
            }
        }

        if (pool.size() < 10) {
            pool.addAll(exerciseRepository.findAll());
        }

        List<Exercise> distinct = dedupeById(pool);
        java.util.Collections.shuffle(distinct);
        return distinct.stream().limit(10).toList();
    }

    public List<Exercise> getDailyPlan(Long userId) {
        List<Exercise> recommended = getRecommended(userId);
        List<Exercise> varied = new ArrayList<>();
        Set<ExerciseCategory> used = EnumSet.noneOf(ExerciseCategory.class);

        for (Exercise exercise : recommended) {
            if (used.add(exercise.getCategory())) {
                varied.add(exercise);
            }
            if (varied.size() == 5) {
                return varied;
            }
        }

        for (Exercise exercise : recommended) {
            if (!varied.contains(exercise)) {
                varied.add(exercise);
            }
            if (varied.size() == 5) {
                break;
            }
        }
        return varied;
    }

    public ExerciseLogResponse logExerciseById(Long userId, Long exerciseId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Unauthorized"));
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Exercise not found"));

        int caloriesBurned = (int) Math.round(exercise.getDurationMinutes() * exercise.getCaloriesBurnedPerMin());
        ExerciseLog saved = exerciseLogRepository.save(ExerciseLog.builder()
                .user(user)
                .exerciseName(exercise.getName())
                .category(toLogCategory(exercise.getCategory()))
                .durationMinutes(exercise.getDurationMinutes())
                .caloriesBurned(caloriesBurned)
                .notes("Logged from exercise recommendations")
                .logDate(LocalDate.now())
                .build());

        return ExerciseLogResponse.builder()
                .id(saved.getId())
                .exerciseName(saved.getExerciseName())
                .category(saved.getCategory())
                .durationMinutes(saved.getDurationMinutes())
                .caloriesBurned(saved.getCaloriesBurned())
                .notes(saved.getNotes())
                .logDate(saved.getLogDate())
                .build();
    }

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Unauthorized"));
    }

    private Set<ExerciseCategory> deriveGoalCategories(User user) {
        List<Goal> goals = goalRepository.findByUserAndStatus(user, GoalStatus.ACTIVE);
        if (goals.isEmpty()) {
            return EnumSet.allOf(ExerciseCategory.class);
        }

        Set<ExerciseCategory> categories = EnumSet.noneOf(ExerciseCategory.class);
        for (Goal goal : goals) {
            GoalType type = goal.getGoalType();
            switch (type) {
                case WEIGHT_LOSS -> {
                    categories.add(ExerciseCategory.CARDIO);
                    categories.add(ExerciseCategory.HIIT);
                }
                case WEIGHT_GAIN -> categories.add(ExerciseCategory.STRENGTH);
                case SLEEP_HOURS -> categories.add(ExerciseCategory.YOGA);
                default -> {
                    categories.add(ExerciseCategory.CARDIO);
                    categories.add(ExerciseCategory.STRENGTH);
                    categories.add(ExerciseCategory.FLEXIBILITY);
                }
            }
        }

        if (categories.isEmpty()) {
            categories.addAll(EnumSet.allOf(ExerciseCategory.class));
        }
        return categories;
    }

    private List<Exercise> dedupeById(List<Exercise> items) {
        List<Exercise> unique = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (Exercise item : items) {
            if (item.getId() != null && seen.add(item.getId())) {
                unique.add(item);
            }
        }
        return unique;
    }

    private com.vitatrack.fitness.ExerciseCategory toLogCategory(ExerciseCategory category) {
        return switch (category) {
            case CARDIO, HIIT -> com.vitatrack.fitness.ExerciseCategory.CARDIO;
            case STRENGTH -> com.vitatrack.fitness.ExerciseCategory.STRENGTH;
            case YOGA, FLEXIBILITY -> com.vitatrack.fitness.ExerciseCategory.FLEXIBILITY;
        };
    }
}

