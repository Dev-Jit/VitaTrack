package com.vitatrack.exercise;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findByCategory(ExerciseCategory category);

    List<Exercise> findByCategoryAndDifficulty(ExerciseCategory category, ExerciseDifficulty difficulty);
}

