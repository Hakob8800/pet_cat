package com.qrmenu.dto;

import com.qrmenu.entity.OrderStatus;

public record CreateOrderResponse(
        Long orderId,
        OrderStatus status,
        String message
) {}
