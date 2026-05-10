package com.vitatrack.video.dto;

import com.vitatrack.goal.GoalType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoDTO {
    private Long id;
    private String title;
    private String youtubeVideoId;
    private String youtubeEmbedUrl;
    private String thumbnailUrl;
    private Integer durationSeconds;
    private String category;
    private String difficulty;
    private GoalType goalType;
    private String instructor;
}

