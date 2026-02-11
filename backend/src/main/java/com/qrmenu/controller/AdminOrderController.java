package com.qrmenu.controller;

import com.qrmenu.dto.OrderDto;
import com.qrmenu.entity.OrderStatus;
import com.qrmenu.entity.User;
import com.qrmenu.service.OrderService;
import com.qrmenu.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;
    private final RestaurantService restaurantService;

    @GetMapping
    public ResponseEntity<List<OrderDto>> getOrders(
            @RequestParam Long restaurantId,
            @AuthenticationPrincipal User user) {
        // Validate ownership
        restaurantService.getOwnedRestaurant(restaurantId, user);

        List<OrderDto> orders = orderService.getOrdersByRestaurant(restaurantId);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestParam Long restaurantId,
            @AuthenticationPrincipal User user) {
        // Validate ownership
        restaurantService.getOwnedRestaurant(restaurantId, user);

        OrderStatus newStatus = OrderStatus.valueOf(body.get("status"));
        OrderDto updated = orderService.updateOrderStatus(id, newStatus, restaurantId);
        return ResponseEntity.ok(updated);
    }
}
