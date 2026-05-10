package com.vitatrack.nutrition;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vitatrack.user.User;

public interface WaterLogRepository extends JpaRepository<WaterLog, Long> {

    @Query("""
            SELECT COALESCE(SUM(w.amountMl), 0)
            FROM WaterLog w
            WHERE w.user = :user
              AND w.loggedAt >= :start
              AND w.loggedAt < :end
            """)
    Integer sumAmountMlByUserAndDate(@Param("user") User user, @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            SELECT COALESCE(SUM(w.amountMl), 0)
            FROM WaterLog w
            WHERE w.user = :user
              AND w.loggedAt >= :start
              AND w.loggedAt < :end
            """)
    Integer sumAmountMlByUserBetween(@Param("user") User user, @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
