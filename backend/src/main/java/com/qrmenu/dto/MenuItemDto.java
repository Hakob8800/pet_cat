package com.qrmenu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record MenuItemDto(
        Long id,
        @NotBlank String name,
        String description,
        @NotNull @Positive BigDecimal price,
        String imageUrl,
        Boolean available,
        Integer position
) {}
