package com.qrmenu.dto;

public record TableDto(
        Long id,
        Integer number,
        String qrCodeUrl,
        Boolean isActive
) {}
