package com.vitatrack.exercise;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ExerciseRepository exerciseRepository;

    @Override
    public void run(String... args) {
        if (exerciseRepository.count() > 0) {
            return;
        }

        List<Exercise> exercises = List.of(
                Exercise.builder().name("Brisk Walking").category(ExerciseCategory.CARDIO)
                        .difficulty(ExerciseDifficulty.BEGINNER).durationMinutes(30).caloriesBurnedPerMin(4.0)
                        .muscleGroup("Full Body").videoUrl("https://example.com/videos/brisk-walking")
                        .thumbnailUrl("https://example.com/thumbs/brisk-walking.jpg").build(),
                Exercise.builder().name("Jogging").category(ExerciseCategory.CARDIO)
                        .difficulty(ExerciseDifficulty.INTERMEDIATE).durationMinutes(25).caloriesBurnedPerMin(7.0)
                        .muscleGroup("Lower Body").videoUrl("https://example.com/videos/jogging")
                        .thumbnailUrl("https://example.com/thumbs/jogging.jpg").build(),
                Exercise.builder().name("Cycling Intervals").category(ExerciseCategory.CARDIO)
                        .difficulty(ExerciseDifficulty.ADVANCED).durationMinutes(35).caloriesBurnedPerMin(9.0)
                        .muscleGroup("Lower Body").videoUrl("https://example.com/videos/cycling-intervals")
                        .thumbnailUrl("https://example.com/thumbs/cycling-intervals.jpg").build(),

                Exercise.builder().name("Bodyweight Squats").category(ExerciseCategory.STRENGTH)
                        .difficulty(ExerciseDifficulty.BEGINNER).durationMinutes(20).caloriesBurnedPerMin(5.5)
                        .muscleGroup("Legs").videoUrl("https://example.com/videos/bodyweight-squats")
                        .thumbnailUrl("https://example.com/thumbs/bodyweight-squats.jpg").build(),
                Exercise.builder().name("Push-Ups").category(ExerciseCategory.STRENGTH)
                        .difficulty(ExerciseDifficulty.INTERMEDIATE).durationMinutes(20).caloriesBurnedPerMin(6.0)
                        .muscleGroup("Chest").videoUrl("https://example.com/videos/push-ups")
                        .thumbnailUrl("https://example.com/thumbs/push-ups.jpg").build(),
                Exercise.builder().name("Deadlift").category(ExerciseCategory.STRENGTH)
                        .difficulty(ExerciseDifficulty.ADVANCED).durationMinutes(30).caloriesBurnedPerMin(8.0)
                        .muscleGroup("Posterior Chain").videoUrl("https://example.com/videos/deadlift")
                        .thumbnailUrl("https://example.com/thumbs/deadlift.jpg").build(),

                Exercise.builder().name("Jumping Jacks").category(ExerciseCategory.HIIT)
                        .difficulty(ExerciseDifficulty.BEGINNER).durationMinutes(15).caloriesBurnedPerMin(8.0)
                        .muscleGroup("Full Body").videoUrl("https://example.com/videos/jumping-jacks")
                        .thumbnailUrl("https://example.com/thumbs/jumping-jacks.jpg").build(),
                Exercise.builder().name("Burpees").category(ExerciseCategory.HIIT)
                        .difficulty(ExerciseDifficulty.INTERMEDIATE).durationMinutes(18).caloriesBurnedPerMin(10.0)
                        .muscleGroup("Full Body").videoUrl("https://example.com/videos/burpees")
                        .thumbnailUrl("https://example.com/thumbs/burpees.jpg").build(),
                Exercise.builder().name("Mountain Climbers").category(ExerciseCategory.HIIT)
                        .difficulty(ExerciseDifficulty.ADVANCED).durationMinutes(20).caloriesBurnedPerMin(11.0)
                        .muscleGroup("Core").videoUrl("https://example.com/videos/mountain-climbers")
                        .thumbnailUrl("https://example.com/thumbs/mountain-climbers.jpg").build(),

                Exercise.builder().name("Sun Salutation").category(ExerciseCategory.YOGA)
                        .difficulty(ExerciseDifficulty.BEGINNER).durationMinutes(20).caloriesBurnedPerMin(3.0)
                        .muscleGroup("Full Body").videoUrl("https://example.com/videos/sun-salutation")
                        .thumbnailUrl("https://example.com/thumbs/sun-salutation.jpg").build(),
                Exercise.builder().name("Vinyasa Flow").category(ExerciseCategory.YOGA)
                        .difficulty(ExerciseDifficulty.INTERMEDIATE).durationMinutes(30).caloriesBurnedPerMin(4.0)
                        .muscleGroup("Core").videoUrl("https://example.com/videos/vinyasa-flow")
                        .thumbnailUrl("https://example.com/thumbs/vinyasa-flow.jpg").build(),
                Exercise.builder().name("Power Yoga").category(ExerciseCategory.YOGA)
                        .difficulty(ExerciseDifficulty.ADVANCED).durationMinutes(35).caloriesBurnedPerMin(5.0)
                        .muscleGroup("Full Body").videoUrl("https://example.com/videos/power-yoga")
                        .thumbnailUrl("https://example.com/thumbs/power-yoga.jpg").build(),

                Exercise.builder().name("Hamstring Stretch").category(ExerciseCategory.FLEXIBILITY)
                        .difficulty(ExerciseDifficulty.BEGINNER).durationMinutes(15).caloriesBurnedPerMin(2.0)
                        .muscleGroup("Hamstrings").videoUrl("https://example.com/videos/hamstring-stretch")
                        .thumbnailUrl("https://example.com/thumbs/hamstring-stretch.jpg").build(),
                Exercise.builder().name("Hip Mobility Flow").category(ExerciseCategory.FLEXIBILITY)
                        .difficulty(ExerciseDifficulty.INTERMEDIATE).durationMinutes(20).caloriesBurnedPerMin(2.5)
                        .muscleGroup("Hips").videoUrl("https://example.com/videos/hip-mobility-flow")
                        .thumbnailUrl("https://example.com/thumbs/hip-mobility-flow.jpg").build(),
                Exercise.builder().name("Full-Body Mobility Routine").category(ExerciseCategory.FLEXIBILITY)
                        .difficulty(ExerciseDifficulty.ADVANCED).durationMinutes(25).caloriesBurnedPerMin(3.0)
                        .muscleGroup("Full Body").videoUrl("https://example.com/videos/full-body-mobility")
                        .thumbnailUrl("https://example.com/thumbs/full-body-mobility.jpg").build());

        exerciseRepository.saveAll(exercises);
    }
}

