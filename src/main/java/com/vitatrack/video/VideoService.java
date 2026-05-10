package com.vitatrack.video;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.vitatrack.goal.Goal;
import com.vitatrack.goal.GoalRepository;
import com.vitatrack.goal.GoalStatus;
import com.vitatrack.goal.GoalType;
import com.vitatrack.user.User;
import com.vitatrack.user.UserRepository;
import com.vitatrack.video.dto.VideoDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VideoService {

    private final VideoRepository videoRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public List<VideoDTO> getRecommendedVideos() {
        User user = getCurrentUser();
        List<Goal> activeGoals = goalRepository.findByUserAndStatus(user, GoalStatus.ACTIVE);

        List<VideoResource> videos;
        if (activeGoals.isEmpty()) {
            videos = new ArrayList<>(videoRepository.findAll());
        } else {
            GoalType primaryGoal = activeGoals.get(0).getGoalType();
            videos = new ArrayList<>(videoRepository.findByGoalType(primaryGoal));
            if (videos.isEmpty()) {
                videos = new ArrayList<>(videoRepository.findAll());
            }
        }

        Collections.shuffle(videos);
        return videos.stream().limit(6).map(this::toDto).toList();
    }

    public List<VideoDTO> getVideosByCategory(String category) {
        List<VideoResource> videos;
        if (category == null || category.isBlank()) {
            videos = videoRepository.findAll();
        } else {
            videos = videoRepository.findByCategoryIgnoreCase(category.trim());
        }
        return videos.stream().map(this::toDto).toList();
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

    private VideoDTO toDto(VideoResource resource) {
        return VideoDTO.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .youtubeVideoId(resource.getYoutubeVideoId())
                .youtubeEmbedUrl("https://www.youtube.com/embed/" + resource.getYoutubeVideoId())
                .thumbnailUrl(resource.getThumbnailUrl())
                .durationSeconds(resource.getDurationSeconds())
                .category(resource.getCategory())
                .difficulty(resource.getDifficulty())
                .goalType(resource.getGoalType())
                .instructor(resource.getInstructor())
                .build();
    }
}

