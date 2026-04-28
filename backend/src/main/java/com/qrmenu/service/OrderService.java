package com.qrmenu.service;

import com.qrmenu.dto.*;
import com.qrmenu.entity.*;
import com.qrmenu.repository.MenuItemRepository;
import com.qrmenu.repository.OrderRepository;
import com.qrmenu.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final TableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        // 1. Find and validate table
        RestaurantTable table = tableRepository.findById(request.tableId())
                .orElseThrow(() -> new RuntimeException("Table not found"));

        if (!table.getIsActive()) {
            throw new RuntimeException("Table is not active");
        }

        Restaurant restaurant = table.getRestaurant();

        // 2. Create order
        Order order = new Order();
        order.setRestaurant(restaurant);
        order.setTable(table);

        // 3. Add items with validation
        for (CreateOrderRequest.OrderItemRequest itemRequest : request.items()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.menuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found: " + itemRequest.menuItemId()));

            // Validate menu item belongs to same restaurant
            if (!menuItem.getCategory().getRestaurant().getId().equals(restaurant.getId())) {
                throw new RuntimeException("Menu item does not belong to this restaurant");
            }

            if (!Boolean.TRUE.equals(menuItem.getAvailable())) {
                throw new RuntimeException("Menu item is not available: " + menuItem.getName());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemRequest.quantity());
            orderItem.setPriceAtOrder(menuItem.getPrice());
            order.addItem(orderItem);
        }

        // 4. Save
        order = orderRepository.save(order);

        // 5. Broadcast via WebSocket
        OrderDto orderDto = toDto(order);
        messagingTemplate.convertAndSend(
                "/topic/restaurants/" + restaurant.getId() + "/orders",
                orderDto
        );

        // 6. Broadcast to per-order topic for guest tracking
        messagingTemplate.convertAndSend(
                "/topic/orders/" + order.getId(),
                orderDto
        );

        return new CreateOrderResponse(order.getId(), restaurant.getId(), order.getStatus(), "Order created successfully");
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersByRestaurant(Long restaurantId) {
        return orderRepository.findByRestaurantIdWithDetails(restaurantId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus newStatus, Long restaurantId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getRestaurant().getId().equals(restaurantId)) {
            throw new RuntimeException("Access denied");
        }

        if (!order.getStatus().canTransitionTo(newStatus)) {
            throw new IllegalArgumentException(
                    "Invalid status transition: " + order.getStatus() + " -> " + newStatus);
        }

        order.setStatus(newStatus);
        order = orderRepository.save(order);

        // Broadcast status update via WebSocket
        OrderDto orderDto = toDto(order);
        messagingTemplate.convertAndSend(
                "/topic/restaurants/" + restaurantId + "/orders",
                orderDto
        );
        messagingTemplate.convertAndSend(
                "/topic/orders/" + orderId,
                orderDto
        );

        return orderDto;
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderStatus(Long orderId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return toDto(order);
    }

    private OrderDto toDto(Order order) {
        List<OrderItemDto> itemDtos = order.getItems().stream()
                .map(item -> new OrderItemDto(
                        item.getId(),
                        item.getMenuItem().getId(),
                        item.getMenuItem().getName(),
                        item.getMenuItem().getPrice(),
                        item.getQuantity()
                ))
                .toList();

        return new OrderDto(
                order.getId(),
                order.getTable().getNumber(),
                order.getStatus(),
                order.getCreatedAt(),
                itemDtos
        );
    }
}
