package com.vitatrack.nutrition;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vitatrack.user.User;

public interface FoodLogRepository extends JpaRepository<FoodLog, Long> {
    @Query("""
            SELECT f
            FROM FoodLog f
            JOIN FETCH f.foodItem
            WHERE f.user = :user AND f.logDate = :logDate
            ORDER BY f.id DESC
            """)
    List<FoodLog> findByUserAndLogDateOrderByIdDesc(@Param("user") User user, @Param("logDate") LocalDate logDate);

    Optional<FoodLog> findByIdAndUser(Long id, User user);

    @Query("""
            SELECT COALESCE(SUM((f.foodItem.calories * f.quantity) / 100.0), 0.0)
            FROM FoodLog f
            WHERE f.user = :user AND f.logDate = :date
            """)
    Double sumCaloriesByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM((f.foodItem.calories * f.quantity) / 100.0), 0.0)
            FROM FoodLog f
            WHERE f.user = :user AND f.logDate BETWEEN :startDate AND :endDate
            """)
    Double sumCaloriesByUserBetweenDates(@Param("user") User user, @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT COALESCE(SUM((f.foodItem.protein * f.quantity) / 100.0), 0.0)
            FROM FoodLog f
            WHERE f.user = :user AND f.logDate = :date
            """)
    Double sumProteinByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM((f.foodItem.carbs * f.quantity) / 100.0), 0.0)
            FROM FoodLog f
            WHERE f.user = :user AND f.logDate = :date
            """)
    Double sumCarbsByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM((f.foodItem.fat * f.quantity) / 100.0), 0.0)
            FROM FoodLog f
            WHERE f.user = :user AND f.logDate = :date
            """)
    Double sumFatByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM((f.foodItem.fiber * f.quantity) / 100.0), 0.0)
            FROM FoodLog f
            WHERE f.user = :user AND f.logDate = :date
            """)
    Double sumFiberByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM((f.foodItem.protein * f.quantity) / 100.0), 0.0)
            FROM FoodLog f
            WHERE f.user = :user AND f.logDate BETWEEN :startDate AND :endDate
            """)
    Double sumProteinByUserBetweenDates(@Param("user") User user, @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT COALESCE(SUM((f.foodItem.carbs * f.quantity) / 100.0), 0.0)
            FROM FoodLog f
            WHERE f.user = :user AND f.logDate BETWEEN :startDate AND :endDate
            """)
    Double sumCarbsByUserBetweenDates(@Param("user") User user, @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT COALESCE(SUM((f.foodItem.fat * f.quantity) / 100.0), 0.0)
            FROM FoodLog f
            WHERE f.user = :user AND f.logDate BETWEEN :startDate AND :endDate
            """)
    Double sumFatByUserBetweenDates(@Param("user") User user, @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT COALESCE(SUM((f.foodItem.fiber * f.quantity) / 100.0), 0.0)
            FROM FoodLog f
            WHERE f.user = :user AND f.logDate BETWEEN :startDate AND :endDate
            """)
    Double sumFiberByUserBetweenDates(@Param("user") User user, @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
