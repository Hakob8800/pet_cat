package com.qrmenu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RestaurantDto(
        Long id,
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase letters, numbers and hyphens")
        String slug,
        String description,
        @jakarta.validation.constraints.Size(max = 5) String currency
) {}
