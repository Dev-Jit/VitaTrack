package com.vitatrack.profile.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Past;
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
public class ProfileDTO {
    private String firstName;
    private String lastName;
    @Past(message = "dateOfBirth cannot be in the future")
    private LocalDate dateOfBirth;
    private String gender;
    private Integer heightCm;
    private String profilePicUrl;
    private String timezone;
    private Integer dailyWaterGoalMl;
}
