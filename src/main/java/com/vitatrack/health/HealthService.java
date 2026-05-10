package com.vitatrack.health;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.vitatrack.health.dto.HealthMetricRequest;
import com.vitatrack.health.dto.HealthMetricResponse;
import com.vitatrack.user.User;
import com.vitatrack.user.UserProfile;
import com.vitatrack.user.UserProfileRepository;
import com.vitatrack.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HealthService {

    private final HealthMetricRepository healthMetricRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public HealthMetricResponse createMetric(HealthMetricRequest request) {
        User user = getCurrentUser();

        HealthMetric saved = healthMetricRepository.save(HealthMetric.builder()
                .user(user)
                .metricType(request.getMetricType())
                .value(request.getValue())
                .unit(request.getUnit())
                .recordedAt(request.getRecordedAt())
                .notes(request.getNotes())
                .build());

        autoCreateBmiMetricIfApplicable(user, request);
        return toResponse(saved);
    }

    public List<HealthMetricResponse> getMetrics(MetricType type, LocalDate startDate, LocalDate endDate) {
        User user = getCurrentUser();
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        List<HealthMetric> metrics;
        if (type == null) {
            metrics = healthMetricRepository.findByUserAndRecordedAtBetweenOrderByRecordedAtDesc(user, start, end);
        } else {
            metrics = healthMetricRepository.findByUserAndMetricTypeAndRecordedAtBetweenOrderByRecordedAtDesc(
                    user, type, start, end);
        }

        return metrics.stream().map(this::toResponse).toList();
    }

    private void autoCreateBmiMetricIfApplicable(User user, HealthMetricRequest request) {
        if (request.getMetricType() != MetricType.WEIGHT) {
            return;
        }

        UserProfile profile = userProfileRepository.findByUser(user).orElse(null);
        if (profile == null || profile.getHeightCm() == null || profile.getHeightCm() <= 0) {
            return;
        }

        double heightMeters = profile.getHeightCm() / 100.0;
        double bmi = request.getValue() / (heightMeters * heightMeters);
        double roundedBmi = Math.round(bmi * 100.0) / 100.0;

        healthMetricRepository.save(HealthMetric.builder()
                .user(user)
                .metricType(MetricType.BMI)
                .value(roundedBmi)
                .unit("kg/m2")
                .recordedAt(request.getRecordedAt())
                .notes("Auto-calculated from weight and profile height")
                .build());
    }

    private HealthMetricResponse toResponse(HealthMetric metric) {
        return HealthMetricResponse.builder()
                .id(metric.getId())
                .metricType(metric.getMetricType())
                .value(metric.getValue())
                .unit(metric.getUnit())
                .recordedAt(metric.getRecordedAt())
                .notes(metric.getNotes())
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
