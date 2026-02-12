package com.qrmenu.service;

import com.qrmenu.dto.CreateOrderRequest;
import com.qrmenu.dto.CreateOrderResponse;
import com.qrmenu.dto.OrderDto;
import com.qrmenu.entity.*;
import com.qrmenu.repository.MenuItemRepository;
import com.qrmenu.repository.OrderRepository;
import com.qrmenu.repository.TableRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private TableRepository tableRepository;

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private OrderService orderService;

    private Restaurant restaurant;
    private RestaurantTable table;
    private Category category;
    private MenuItem menuItem;

    @BeforeEach
    void setUp() {
        restaurant = new Restaurant();
        restaurant.setId(1L);
        restaurant.setName("Test Restaurant");
        restaurant.setSlug("test-restaurant");

        table = new RestaurantTable();
        table.setId(1L);
        table.setNumber(1);
        table.setIsActive(true);
        table.setRestaurant(restaurant);

        category = new Category();
        category.setId(1L);
        category.setName("Main");
        category.setRestaurant(restaurant);

        menuItem = new MenuItem();
        menuItem.setId(1L);
        menuItem.setName("Burger");
        menuItem.setPrice(new BigDecimal("15.99"));
        menuItem.setAvailable(true);
        menuItem.setCategory(category);
    }

    @Test
    void createOrder_Success() {
        CreateOrderRequest request = new CreateOrderRequest(
                1L,
                List.of(new CreateOrderRequest.OrderItemRequest(1L, 2))
        );

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(menuItemRepository.findById(1L)).thenReturn(Optional.of(menuItem));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(1L);
            return order;
        });

        CreateOrderResponse response = orderService.createOrder(request);

        assertThat(response.orderId()).isEqualTo(1L);
        assertThat(response.status()).isEqualTo(OrderStatus.NEW);
        assertThat(response.message()).isEqualTo("Order created successfully");

        // Verify WebSocket broadcast
        verify(messagingTemplate).convertAndSend(
                eq("/topic/restaurants/1/orders"),
                any(OrderDto.class)
        );
    }

    @Test
    void createOrder_TableNotFound_ThrowsException() {
        CreateOrderRequest request = new CreateOrderRequest(
                999L,
                List.of(new CreateOrderRequest.OrderItemRequest(1L, 2))
        );

        when(tableRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Table not found");
    }

    @Test
    void createOrder_TableNotActive_ThrowsException() {
        table.setIsActive(false);
        CreateOrderRequest request = new CreateOrderRequest(
                1L,
                List.of(new CreateOrderRequest.OrderItemRequest(1L, 2))
        );

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));

        assertThatThrownBy(() -> orderService.createOrder(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Table is not active");
    }

    @Test
    void createOrder_MenuItemNotFound_ThrowsException() {
        CreateOrderRequest request = new CreateOrderRequest(
                1L,
                List.of(new CreateOrderRequest.OrderItemRequest(999L, 2))
        );

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(menuItemRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Menu item not found: 999");
    }

    @Test
    void createOrder_MenuItemNotAvailable_ThrowsException() {
        menuItem.setAvailable(false);
        CreateOrderRequest request = new CreateOrderRequest(
                1L,
                List.of(new CreateOrderRequest.OrderItemRequest(1L, 2))
        );

        when(tableRepository.findById(1L)).thenReturn(Optional.of(table));
        when(menuItemRepository.findById(1L)).thenReturn(Optional.of(menuItem));

        assertThatThrownBy(() -> orderService.createOrder(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Menu item is not available: Burger");
    }

    @Test
    void updateOrderStatus_Success() {
        Order order = new Order();
        order.setId(1L);
        order.setRestaurant(restaurant);
        order.setTable(table);
        order.setStatus(OrderStatus.NEW);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderDto result = orderService.updateOrderStatus(1L, OrderStatus.DONE, 1L);

        assertThat(result.status()).isEqualTo(OrderStatus.DONE);

        // Verify WebSocket broadcast
        verify(messagingTemplate).convertAndSend(
                eq("/topic/restaurants/1/orders"),
                any(OrderDto.class)
        );
    }

    @Test
    void updateOrderStatus_OrderNotFound_ThrowsException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.updateOrderStatus(999L, OrderStatus.DONE, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Order not found");
    }

    @Test
    void updateOrderStatus_AccessDenied_ThrowsException() {
        Order order = new Order();
        order.setId(1L);
        order.setRestaurant(restaurant);
        order.setTable(table);
        order.setStatus(OrderStatus.NEW);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        // Try to update with different restaurant ID
        assertThatThrownBy(() -> orderService.updateOrderStatus(1L, OrderStatus.DONE, 999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Access denied");
    }

    @Test
    void getOrdersByRestaurant_Success() {
        Order order = new Order();
        order.setId(1L);
        order.setRestaurant(restaurant);
        order.setTable(table);
        order.setStatus(OrderStatus.NEW);

        when(orderRepository.findByRestaurantIdWithDetails(1L)).thenReturn(List.of(order));

        List<OrderDto> result = orderService.getOrdersByRestaurant(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
        assertThat(result.get(0).tableNumber()).isEqualTo(1);
    }
}
