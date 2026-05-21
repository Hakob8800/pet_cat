package com.qrmenu.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record CreateOrderRequest(
        @NotNull(message = "Table ID is required")
        Long tableId,

        @NotEmpty(message = "Order must have at least one item")
        @Valid
        List<OrderItemRequest> items,

        @jakarta.validation.constraints.Size(max = 500, message = "Notes must be at most 500 characters")
        String notes
) {
    public record OrderItemRequest(
            @NotNull(message = "Menu item ID is required")
            Long menuItemId,

            @NotNull(message = "Quantity is required")
            @Positive(message = "Quantity must be positive")
            Integer quantity
    ) {}
}
