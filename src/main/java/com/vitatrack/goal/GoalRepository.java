package com.vitatrack.goal;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vitatrack.goal.GoalStatus;
import com.vitatrack.user.User;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserOrderByStartDateDescIdDesc(User user);

    List<Goal> findByUserAndStatus(User user, GoalStatus status);

    Optional<Goal> findByIdAndUser(Long id, User user);
}
