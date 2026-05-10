package com.vitatrack.video;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vitatrack.video.dto.VideoDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;

    @GetMapping("/recommended")
    public ResponseEntity<List<VideoDTO>> getRecommended() {
        return ResponseEntity.ok(videoService.getRecommendedVideos());
    }

    @GetMapping
    public ResponseEntity<List<VideoDTO>> getVideos(@RequestParam(value = "category", required = false) String category) {
        return ResponseEntity.ok(videoService.getVideosByCategory(category));
    }
}

