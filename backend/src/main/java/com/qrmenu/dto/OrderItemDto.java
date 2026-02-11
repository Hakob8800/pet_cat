package com.qrmenu.dto;

import java.math.BigDecimal;

public record OrderItemDto(
        Long id,
        Long menuItemId,
        String menuItemName,
        BigDecimal price,
        Integer quantity
) {}
