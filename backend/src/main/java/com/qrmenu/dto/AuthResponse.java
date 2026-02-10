package com.qrmenu.dto;

public record AuthResponse(
        String token,
        Long userId,
        String email,
        String name
) {}
