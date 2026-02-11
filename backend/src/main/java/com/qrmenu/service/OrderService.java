package com.qrmenu.service;

import com.qrmenu.dto.*;
import com.qrmenu.entity.*;
import com.qrmenu.repository.MenuItemRepository;
import com.qrmenu.repository.OrderRepository;
import com.qrmenu.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final TableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;

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

            if (!menuItem.getAvailable()) {
                throw new RuntimeException("Menu item is not available: " + menuItem.getName());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemRequest.quantity());
            order.addItem(orderItem);
        }

        // 4. Save
        order = orderRepository.save(order);

        return new CreateOrderResponse(order.getId(), order.getStatus(), "Order created successfully");
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

        order.setStatus(newStatus);
        order = orderRepository.save(order);

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
