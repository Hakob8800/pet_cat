package com.qrmenu.dto;

import com.qrmenu.entity.OrderStatus;

public record CreateOrderResponse(
        Long orderId,
        Long restaurantId,
        OrderStatus status,
        String message
) {}
