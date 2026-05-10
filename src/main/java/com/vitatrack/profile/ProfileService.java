package com.vitatrack.profile;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.vitatrack.profile.dto.ProfileDTO;
import com.vitatrack.user.User;
import com.vitatrack.user.UserProfile;
import com.vitatrack.user.UserProfileRepository;
import com.vitatrack.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public ProfileDTO getProfile() {
        User user = getCurrentUser();
        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> userProfileRepository.save(UserProfile.builder()
                        .user(user)
                        .firstName("")
                        .lastName("")
                        .dailyWaterGoalMl(3000)
                        .build()));

        return toDto(profile);
    }

    public ProfileDTO upsertProfile(ProfileDTO request) {
        User user = getCurrentUser();
        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> UserProfile.builder().user(user).build());

        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setHeightCm(request.getHeightCm());
        profile.setProfilePicUrl(request.getProfilePicUrl());
        profile.setTimezone(request.getTimezone());
        profile.setDailyWaterGoalMl(request.getDailyWaterGoalMl());

        UserProfile saved = userProfileRepository.save(profile);
        return toDto(saved);
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

    private ProfileDTO toDto(UserProfile profile) {
        return ProfileDTO.builder()
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .heightCm(profile.getHeightCm())
                .profilePicUrl(profile.getProfilePicUrl())
                .timezone(profile.getTimezone())
                .dailyWaterGoalMl(profile.getDailyWaterGoalMl())
                .build();
    }
}
