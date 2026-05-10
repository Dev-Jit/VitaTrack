package com.vitatrack.video;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vitatrack.goal.GoalType;

public interface VideoRepository extends JpaRepository<VideoResource, Long> {
    List<VideoResource> findByCategoryIgnoreCase(String category);

    List<VideoResource> findByGoalType(GoalType goalType);
}

