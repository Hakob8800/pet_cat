package com.qrmenu.controller;

import com.qrmenu.dto.CreateOrderRequest;
import com.qrmenu.dto.CreateOrderResponse;
import com.qrmenu.dto.OrderDto;
import com.qrmenu.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/orders")
@RequiredArgsConstructor
public class PublicOrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<CreateOrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        CreateOrderResponse response = orderService.createOrder(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrderStatus(@PathVariable Long id) {
        OrderDto order = orderService.getOrderStatus(id);
        return ResponseEntity.ok(order);
    }
}
