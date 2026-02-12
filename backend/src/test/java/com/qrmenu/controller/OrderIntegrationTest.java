package com.qrmenu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qrmenu.dto.CreateOrderRequest;
import com.qrmenu.dto.RegisterRequest;
import com.qrmenu.dto.RestaurantDto;
import com.qrmenu.dto.TableDto;
import com.qrmenu.entity.*;
import com.qrmenu.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class OrderIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    private String authToken;
    private Restaurant restaurant;
    private RestaurantTable table;
    private MenuItem menuItem;

    @BeforeEach
    void setUp() throws Exception {
        // Register user and get token
        RegisterRequest registerRequest = new RegisterRequest("owner@test.com", "password123", "Owner");
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        authToken = objectMapper.readTree(responseBody).get("token").asText();

        // Create restaurant
        RestaurantDto restaurantDto = new RestaurantDto(null, "Test Restaurant", "test-rest", "Description");
        result = mockMvc.perform(post("/api/restaurants")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(restaurantDto)))
                .andExpect(status().isOk())
                .andReturn();

        responseBody = result.getResponse().getContentAsString();
        Long restaurantId = objectMapper.readTree(responseBody).get("id").asLong();
        restaurant = restaurantRepository.findById(restaurantId).orElseThrow();

        // Create table
        TableDto tableDto = new TableDto(null, 1, null, true);
        result = mockMvc.perform(post("/api/restaurants/" + restaurantId + "/tables")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tableDto)))
                .andExpect(status().isOk())
                .andReturn();

        responseBody = result.getResponse().getContentAsString();
        Long tableId = objectMapper.readTree(responseBody).get("id").asLong();
        table = tableRepository.findById(tableId).orElseThrow();

        // Create category
        Category category = new Category();
        category.setName("Main Dishes");
        category.setPosition(1);
        category.setRestaurant(restaurant);
        category = categoryRepository.save(category);

        // Create menu item
        menuItem = new MenuItem();
        menuItem.setName("Burger");
        menuItem.setDescription("Delicious burger");
        menuItem.setPrice(new BigDecimal("12.99"));
        menuItem.setAvailable(true);
        menuItem.setPosition(1);
        menuItem.setCategory(category);
        menuItem = menuItemRepository.save(menuItem);
    }

    @Test
    void createOrder_Success() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(
                table.getId(),
                List.of(new CreateOrderRequest.OrderItemRequest(menuItem.getId(), 2))
        );

        mockMvc.perform(post("/api/public/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").isNumber())
                .andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.message").value("Order created successfully"));

        // Verify order was created
        assertThat(orderRepository.count()).isEqualTo(1);
    }

    @Test
    void createOrder_InvalidTable_Returns404() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(
                999L,
                List.of(new CreateOrderRequest.OrderItemRequest(menuItem.getId(), 2))
        );

        mockMvc.perform(post("/api/public/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Table not found"));
    }

    @Test
    void getOrders_AsOwner_Success() throws Exception {
        // Create an order first
        CreateOrderRequest request = new CreateOrderRequest(
                table.getId(),
                List.of(new CreateOrderRequest.OrderItemRequest(menuItem.getId(), 1))
        );

        mockMvc.perform(post("/api/public/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Get orders as owner
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + authToken)
                        .param("restaurantId", restaurant.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].tableNumber").value(1))
                .andExpect(jsonPath("$[0].status").value("NEW"))
                .andExpect(jsonPath("$[0].items[0].menuItemName").value("Burger"));
    }

    @Test
    void getOrders_Unauthorized_Returns403() throws Exception {
        mockMvc.perform(get("/api/admin/orders")
                        .param("restaurantId", restaurant.getId().toString()))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateOrderStatus_Success() throws Exception {
        // Create an order first
        CreateOrderRequest createRequest = new CreateOrderRequest(
                table.getId(),
                List.of(new CreateOrderRequest.OrderItemRequest(menuItem.getId(), 1))
        );

        MvcResult result = mockMvc.perform(post("/api/public/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(responseBody).get("orderId").asLong();

        // Update status
        mockMvc.perform(put("/api/admin/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + authToken)
                        .param("restaurantId", restaurant.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"));

        // Verify in database
        Order updatedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.DONE);
    }

    @Test
    void createOrder_InactiveTable_Returns400() throws Exception {
        // Deactivate table
        table.setIsActive(false);
        tableRepository.save(table);

        CreateOrderRequest request = new CreateOrderRequest(
                table.getId(),
                List.of(new CreateOrderRequest.OrderItemRequest(menuItem.getId(), 2))
        );

        mockMvc.perform(post("/api/public/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Table is not active"));
    }

    @Test
    void createOrder_UnavailableMenuItem_Returns400() throws Exception {
        // Make menu item unavailable
        menuItem.setAvailable(false);
        menuItemRepository.save(menuItem);

        CreateOrderRequest request = new CreateOrderRequest(
                table.getId(),
                List.of(new CreateOrderRequest.OrderItemRequest(menuItem.getId(), 2))
        );

        mockMvc.perform(post("/api/public/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Menu item is not available: Burger"));
    }
}
