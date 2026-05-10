package com.vitatrack.report;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.vitatrack.fitness.ExerciseLogRepository;
import com.vitatrack.health.HealthMetric;
import com.vitatrack.health.HealthMetricRepository;
import com.vitatrack.health.MetricType;
import com.vitatrack.health.dto.HealthMetricResponse;
import com.vitatrack.nutrition.FoodLogRepository;
import com.vitatrack.nutrition.WaterLogRepository;
import com.vitatrack.report.dto.DailyReportResponse;
import com.vitatrack.report.dto.MonthlyReportResponse;
import com.vitatrack.report.dto.MonthlyTrendPoint;
import com.vitatrack.report.dto.WeeklyReportResponse;
import com.vitatrack.user.User;
import com.vitatrack.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportsService {

    private final FoodLogRepository foodLogRepository;
    private final ExerciseLogRepository exerciseLogRepository;
    private final WaterLogRepository waterLogRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final UserRepository userRepository;

    public DailyReportResponse getDailyReport(LocalDate date) {
        User user = getCurrentUser();
        Double caloriesConsumed = foodLogRepository.sumCaloriesByUserAndDate(user, date);
        Double protein = foodLogRepository.sumProteinByUserAndDate(user, date);
        Double carbs = foodLogRepository.sumCarbsByUserAndDate(user, date);
        Double fat = foodLogRepository.sumFatByUserAndDate(user, date);
        Double fiber = foodLogRepository.sumFiberByUserAndDate(user, date);
        Integer caloriesBurned = exerciseLogRepository.sumCaloriesBurnedByUserAndDate(user, date);
        Integer exerciseMinutes = exerciseLogRepository.sumDurationMinutesByUserAndDate(user, date);
        Integer waterIntake = waterLogRepository.sumAmountMlByUserAndDate(user, date.atStartOfDay(), date.plusDays(1).atStartOfDay());

        List<HealthMetricResponse> metrics = healthMetricRepository
                .findByUserAndRecordedAtBetweenOrderByRecordedAtDesc(user, date.atStartOfDay(), date.plusDays(1).atStartOfDay())
                .stream()
                .map(this::toMetricResponse)
                .toList();

        return DailyReportResponse.builder()
                .date(date)
                .caloriesConsumed(orZero(caloriesConsumed))
                .protein(orZero(protein))
                .carbs(orZero(carbs))
                .fat(orZero(fat))
                .fiber(orZero(fiber))
                .caloriesBurned(orZero(caloriesBurned))
                .exerciseMinutes(orZero(exerciseMinutes))
                .waterIntakeMl(orZero(waterIntake))
                .healthMetrics(metrics)
                .build();
    }

    public WeeklyReportResponse getWeeklyReport(LocalDate startDate) {
        User user = getCurrentUser();
        LocalDate endDate = startDate.plusDays(6);
        Double totalConsumed = orZero(foodLogRepository.sumCaloriesByUserBetweenDates(user, startDate, endDate));
        Integer totalBurned = orZero(exerciseLogRepository.sumCaloriesBurnedByUserBetweenDates(user, startDate, endDate));
        Integer totalWater = orZero(waterLogRepository.sumAmountMlByUserBetween(user, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay()));

        return WeeklyReportResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalCaloriesConsumed(totalConsumed)
                .totalCaloriesBurned(totalBurned)
                .totalWaterIntakeMl(totalWater)
                .averageCaloriesConsumed(round2(totalConsumed / 7.0))
                .averageCaloriesBurned(round2(totalBurned / 7.0))
                .averageWaterIntakeMl(round2(totalWater / 7.0))
                .build();
    }

    public MonthlyReportResponse getMonthlyReport(Integer month, Integer year) {
        User user = getCurrentUser();
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        int days = yearMonth.lengthOfMonth();

        Double totalConsumed = orZero(foodLogRepository.sumCaloriesByUserBetweenDates(user, startDate, endDate));
        Integer totalBurned = orZero(exerciseLogRepository.sumCaloriesBurnedByUserBetweenDates(user, startDate, endDate));
        Integer totalWater = orZero(waterLogRepository.sumAmountMlByUserBetween(user, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay()));

        // Weight trend: use last logged weight of each day (if any).
        Map<LocalDate, Double> weightByDay = new HashMap<>();
        List<HealthMetric> weights = healthMetricRepository.findByUserAndMetricTypeAndRecordedAtBetweenOrderByRecordedAtDesc(
                user,
                MetricType.WEIGHT,
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay());
        for (HealthMetric metric : weights) {
            LocalDate d = metric.getRecordedAt().toLocalDate();
            weightByDay.putIfAbsent(d, metric.getValue());
        }

        // Sleep trend: average sleep hours per day.
        Map<LocalDate, Double> sleepSum = new HashMap<>();
        Map<LocalDate, Integer> sleepCount = new HashMap<>();
        List<HealthMetric> sleeps = healthMetricRepository.findByUserAndMetricTypeAndRecordedAtBetweenOrderByRecordedAtDesc(
                user,
                MetricType.SLEEP_HOURS,
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay());
        for (HealthMetric metric : sleeps) {
            LocalDate d = metric.getRecordedAt().toLocalDate();
            sleepSum.put(d, sleepSum.getOrDefault(d, 0.0) + metric.getValue());
            sleepCount.put(d, sleepCount.getOrDefault(d, 0) + 1);
        }
        Map<LocalDate, Double> sleepAvg = new HashMap<>();
        for (Map.Entry<LocalDate, Double> entry : sleepSum.entrySet()) {
            LocalDate d = entry.getKey();
            int count = sleepCount.getOrDefault(d, 0);
            if (count > 0) {
                sleepAvg.put(d, round2(entry.getValue() / count));
            }
        }

        List<MonthlyTrendPoint> trends = startDate.datesUntil(endDate.plusDays(1))
                .map(date -> MonthlyTrendPoint.builder()
                        .date(date)
                        .caloriesConsumed(orZero(foodLogRepository.sumCaloriesByUserAndDate(user, date)))
                        .caloriesBurned(orZero(exerciseLogRepository.sumCaloriesBurnedByUserAndDate(user, date)))
                        .waterIntakeMl(orZero(waterLogRepository.sumAmountMlByUserAndDate(user, date.atStartOfDay(), date.plusDays(1).atStartOfDay())))
                        .weightKg(weightByDay.get(date))
                        .sleepHoursAvg(sleepAvg.get(date))
                        .build())
                .toList();

        return MonthlyReportResponse.builder()
                .month(month)
                .year(year)
                .totalCaloriesConsumed(totalConsumed)
                .totalCaloriesBurned(totalBurned)
                .totalWaterIntakeMl(totalWater)
                .averageCaloriesConsumed(round2(totalConsumed / days))
                .averageCaloriesBurned(round2(totalBurned / (double) days))
                .averageWaterIntakeMl(round2(totalWater / (double) days))
                .trends(trends)
                .build();
    }

    private HealthMetricResponse toMetricResponse(HealthMetric metric) {
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

    private Double orZero(Double value) {
        return value == null ? 0.0 : value;
    }

    private Integer orZero(Integer value) {
        return value == null ? 0 : value;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
