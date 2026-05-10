package com.vitatrack.goal;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import java.util.List;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.vitatrack.goal.dto.GoalProgressResponse;
import com.vitatrack.goal.dto.GoalRequest;
import com.vitatrack.goal.dto.GoalResponse;
import com.vitatrack.user.User;
import com.vitatrack.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public GoalResponse createGoal(GoalRequest request) {
        User user = getCurrentUser();
        Goal saved = goalRepository.save(Goal.builder()
                .user(user)
                .goalType(request.getGoalType())
                .targetValue(request.getTargetValue())
                .currentValue(request.getCurrentValue())
                .unit(request.getUnit())
                .startDate(request.getStartDate())
                .targetDate(request.getTargetDate())
                .status(request.getStatus())
                .build());
        return toResponse(saved);
    }

    public List<GoalResponse> getGoals() {
        User user = getCurrentUser();
        return goalRepository.findByUserOrderByStartDateDescIdDesc(user).stream().map(this::toResponse).toList();
    }

    public GoalResponse updateGoal(Long id, GoalRequest request) {
        User user = getCurrentUser();
        Goal goal = goalRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Goal not found"));

        goal.setGoalType(request.getGoalType());
        goal.setTargetValue(request.getTargetValue());
        goal.setCurrentValue(request.getCurrentValue());
        goal.setUnit(request.getUnit());
        goal.setStartDate(request.getStartDate());
        goal.setTargetDate(request.getTargetDate());
        goal.setStatus(request.getStatus());

        return toResponse(goalRepository.save(goal));
    }

    public GoalProgressResponse getProgress(Long id) {
        User user = getCurrentUser();
        Goal goal = goalRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Goal not found"));

        double completionPercent = calculateCompletionPercent(goal.getCurrentValue(), goal.getTargetValue());
        return GoalProgressResponse.builder()
                .goalId(goal.getId())
                .currentValue(goal.getCurrentValue())
                .targetValue(goal.getTargetValue())
                .completionPercent(completionPercent)
                .unit(goal.getUnit())
                .build();
    }

    private double calculateCompletionPercent(Double currentValue, Double targetValue) {
        if (targetValue == null || targetValue <= 0) {
            return 0.0;
        }
        double raw = (currentValue / targetValue) * 100.0;
        double bounded = Math.max(0.0, Math.min(100.0, raw));
        return Math.round(bounded * 100.0) / 100.0;
    }

    private GoalResponse toResponse(Goal goal) {
        return GoalResponse.builder()
                .id(goal.getId())
                .goalType(goal.getGoalType())
                .targetValue(goal.getTargetValue())
                .currentValue(goal.getCurrentValue())
                .unit(goal.getUnit())
                .startDate(goal.getStartDate())
                .targetDate(goal.getTargetDate())
                .status(goal.getStatus())
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
