package com.vitatrack.health;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vitatrack.user.User;

public interface HealthMetricRepository extends JpaRepository<HealthMetric, Long> {
    List<HealthMetric> findByUserAndRecordedAtBetweenOrderByRecordedAtDesc(User user, LocalDateTime start,
            LocalDateTime end);

    List<HealthMetric> findByUserAndMetricTypeAndRecordedAtBetweenOrderByRecordedAtDesc(User user, MetricType metricType,
            LocalDateTime start, LocalDateTime end);
}
