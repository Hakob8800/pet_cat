package com.qrmenu.dto;

import com.qrmenu.entity.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record OrderDto(
        Long id,
        Integer tableNumber,
        OrderStatus status,
        LocalDateTime createdAt,
        List<OrderItemDto> items,
        String notes
) {}
