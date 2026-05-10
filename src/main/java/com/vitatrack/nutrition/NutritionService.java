package com.vitatrack.nutrition;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.vitatrack.food.FoodItem;
import com.vitatrack.food.FoodItemRepository;
import com.vitatrack.nutrition.dto.DailyNutritionSummary;
import com.vitatrack.nutrition.dto.DailyWaterSummary;
import com.vitatrack.nutrition.dto.FoodLogRequest;
import com.vitatrack.nutrition.dto.FoodLogResponse;
import com.vitatrack.nutrition.dto.WaterLogRequest;
import com.vitatrack.nutrition.dto.WaterLogResponse;
import com.vitatrack.user.User;
import com.vitatrack.user.UserProfile;
import com.vitatrack.user.UserProfileRepository;
import com.vitatrack.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NutritionService {

    private final FoodLogRepository foodLogRepository;
    private final WaterLogRepository waterLogRepository;
    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public FoodLogResponse createLog(FoodLogRequest request) {
        User user = getCurrentUser();
        FoodItem foodItem = foodItemRepository.findById(request.getFoodItemId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Food item not found"));

        FoodLog log = FoodLog.builder()
                .user(user)
                .foodItem(foodItem)
                .mealType(request.getMealType())
                .quantity(request.getQuantity())
                .logDate(request.getLogDate())
                .build();

        FoodLog saved = foodLogRepository.save(log);
        return toLogResponse(saved);
    }

    public DailyNutritionSummary getLogsByDate(LocalDate date) {
        User user = getCurrentUser();
        List<FoodLogResponse> logs = foodLogRepository.findByUserAndLogDateOrderByIdDesc(user, date)
                .stream()
                .map(this::toLogResponse)
                .toList();

        return DailyNutritionSummary.builder()
                .date(date)
                .totalCalories(sum(logs, FoodLogResponse::getCalories))
                .totalProtein(sum(logs, FoodLogResponse::getProtein))
                .totalCarbs(sum(logs, FoodLogResponse::getCarbs))
                .totalFat(sum(logs, FoodLogResponse::getFat))
                .totalFiber(sum(logs, FoodLogResponse::getFiber))
                .logs(logs)
                .build();
    }

    public void deleteLog(Long id) {
        User user = getCurrentUser();
        FoodLog log = foodLogRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Food log not found"));
        foodLogRepository.delete(log);
    }

    public WaterLogResponse createWaterLog(WaterLogRequest request) {
        User user = getCurrentUser();
        WaterLog saved = waterLogRepository.save(WaterLog.builder()
                .user(user)
                .amountMl(request.getAmountMl())
                .loggedAt(request.getLoggedAt())
                .build());
        return WaterLogResponse.builder()
                .id(saved.getId())
                .amountMl(saved.getAmountMl())
                .loggedAt(saved.getLoggedAt())
                .build();
    }

    public DailyWaterSummary getWaterSummary(LocalDate date) {
        User user = getCurrentUser();
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        Integer total = waterLogRepository.sumAmountMlByUserAndDate(user, start, end);
        Integer dailyGoal = userProfileRepository.findByUser(user)
                .map(UserProfile::getDailyWaterGoalMl)
                .orElse(3000);
        if (dailyGoal == null) {
            dailyGoal = 3000;
        }

        return DailyWaterSummary.builder()
                .date(date)
                .totalMl(total == null ? 0 : total)
                .dailyGoalMl(dailyGoal)
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

    private FoodLogResponse toLogResponse(FoodLog log) {
        FoodItem item = log.getFoodItem();
        double factor = log.getQuantity() / 100.0;

        return FoodLogResponse.builder()
                .id(log.getId())
                .foodItemId(item.getId())
                .foodName(item.getName())
                .brand(item.getBrand())
                .mealType(log.getMealType())
                .quantity(log.getQuantity())
                .logDate(log.getLogDate())
                .calories(item.getCalories() * factor)
                .protein(item.getProtein() * factor)
                .carbs(item.getCarbs() * factor)
                .fat(item.getFat() * factor)
                .fiber(item.getFiber() * factor)
                .build();
    }

    private double sum(List<FoodLogResponse> logs, java.util.function.ToDoubleFunction<FoodLogResponse> extractor) {
        return logs.stream().mapToDouble(extractor).sum();
    }
}
