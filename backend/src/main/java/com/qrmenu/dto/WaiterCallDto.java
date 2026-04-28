package com.qrmenu.dto;

import java.time.LocalDateTime;

public record WaiterCallDto(
        Long tableId,
        Integer tableNumber,
        Long restaurantId,
        LocalDateTime calledAt
) {}
