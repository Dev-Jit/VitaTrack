package com.vitatrack.nutrition.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
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
public class WaterLogRequest {

    @NotNull(message = "amountMl is required")
    @Min(value = 1, message = "amountMl must be at least 1")
    private Integer amountMl;

    @NotNull(message = "loggedAt is required")
    @PastOrPresent(message = "loggedAt cannot be in the future")
    private LocalDateTime loggedAt;
}
