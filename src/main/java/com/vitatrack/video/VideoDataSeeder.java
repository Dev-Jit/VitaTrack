package com.vitatrack.video;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.vitatrack.goal.GoalType;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class VideoDataSeeder implements CommandLineRunner {

    private final VideoRepository videoRepository;

    @Override
    public void run(String... args) {
        if (videoRepository.count() > 0) {
            return;
        }

        List<VideoResource> videos = List.of(
                video("20 Min Beginner Cardio Workout", "ml6cT4AZdqI", 1200, "CARDIO", "BEGINNER",
                        GoalType.WEIGHT_LOSS, "MadFit"),
                video("15 Min HIIT No Equipment", "UBMk30rjy0o", 900, "HIIT", "INTERMEDIATE",
                        GoalType.WEIGHT_LOSS, "Pamela Reif"),
                video("30 Min Fat Burn Cardio", "l0gDqsSUtWo", 1800, "CARDIO", "INTERMEDIATE",
                        GoalType.WEIGHT_LOSS, "FitnessBlender"),
                video("Dumbbell Full Body Strength", "U0bhE67HuDY", 1500, "STRENGTH", "INTERMEDIATE",
                        GoalType.WEIGHT_GAIN, "HASfit"),
                video("Beginner Strength Training", "ixkQaZXVQjs", 1400, "STRENGTH", "BEGINNER",
                        GoalType.WEIGHT_GAIN, "Nourish Move Love"),
                video("Advanced Muscle Building Workout", "2pLT-olgUJs", 1800, "STRENGTH", "ADVANCED",
                        GoalType.WEIGHT_GAIN, "Bodybuilding.com"),
                video("Yoga For Better Sleep", "v7AYKMP6rOE", 1260, "YOGA", "BEGINNER",
                        GoalType.SLEEP_HOURS, "Yoga With Adriene"),
                video("Evening Relaxing Yoga Flow", "4pKly2JojMw", 1500, "YOGA", "INTERMEDIATE",
                        GoalType.SLEEP_HOURS, "Boho Beautiful Yoga"),
                video("10 Min Morning Mobility", "L_xrDAtykMI", 600, "FLEXIBILITY", "BEGINNER",
                        GoalType.EXERCISE_MINUTES, "Tom Merrick"),
                video("Low Impact Fat Burn Session", "50kH47ZztHs", 1200, "CARDIO", "BEGINNER",
                        GoalType.CALORIE_TARGET, "Body Project"));

        videoRepository.saveAll(videos);
    }

    private VideoResource video(
            String title,
            String videoId,
            int durationSeconds,
            String category,
            String difficulty,
            GoalType goalType,
            String instructor) {
        return VideoResource.builder()
                .title(title)
                .youtubeVideoId(videoId)
                .thumbnailUrl("https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg")
                .durationSeconds(durationSeconds)
                .category(category)
                .difficulty(difficulty)
                .goalType(goalType)
                .instructor(instructor)
                .build();
    }
}

