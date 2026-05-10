package com.vitatrack.fitness;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vitatrack.user.User;

public interface ExerciseLogRepository extends JpaRepository<ExerciseLog, Long> {
    long countByUserId(Long userId);

    List<ExerciseLog> findByUserAndLogDateOrderByIdDesc(User user, LocalDate logDate);

    List<ExerciseLog> findByUserAndLogDateBetweenOrderByLogDateDescIdDesc(User user, LocalDate startDate,
            LocalDate endDate);

    Optional<ExerciseLog> findByIdAndUser(Long id, User user);

    @Query("""
            SELECT COALESCE(SUM(e.caloriesBurned), 0)
            FROM ExerciseLog e
            WHERE e.user = :user AND e.logDate = :date
            """)
    Integer sumCaloriesBurnedByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM(e.caloriesBurned), 0)
            FROM ExerciseLog e
            WHERE e.user = :user AND e.logDate BETWEEN :startDate AND :endDate
            """)
    Integer sumCaloriesBurnedByUserBetweenDates(@Param("user") User user, @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT COALESCE(SUM(e.durationMinutes), 0)
            FROM ExerciseLog e
            WHERE e.user = :user AND e.logDate = :date
            """)
    Integer sumDurationMinutesByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM(e.durationMinutes), 0)
            FROM ExerciseLog e
            WHERE e.user = :user AND e.logDate BETWEEN :startDate AND :endDate
            """)
    Integer sumDurationMinutesByUserBetweenDates(@Param("user") User user, @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
