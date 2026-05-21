package com.qrmenu.dto;

import java.math.BigDecimal;
import java.util.List;

public record PublicMenuDto(
        String restaurantName,
        String description,
        String currency,
        List<CategoryWithItems> categories
) {
    public record CategoryWithItems(
            Long id,
            String name,
            List<Item> items
    ) {}

    public record Item(
            Long id,
            String name,
            String description,
            BigDecimal price,
            String imageUrl,
            Boolean available
    ) {}
}
