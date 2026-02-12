package com.qrmenu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qrmenu.dto.RegisterRequest;
import com.qrmenu.dto.RestaurantDto;
import com.qrmenu.repository.RestaurantRepository;
import com.qrmenu.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class RestaurantControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    private String authToken;

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
    }

    @Test
    void createRestaurant_Success() throws Exception {
        RestaurantDto dto = new RestaurantDto(null, "My Restaurant", "my-restaurant", "Great food");

        mockMvc.perform(post("/api/restaurants")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("My Restaurant"))
                .andExpect(jsonPath("$.slug").value("my-restaurant"))
                .andExpect(jsonPath("$.description").value("Great food"));

        assertThat(restaurantRepository.count()).isEqualTo(1);
    }

    @Test
    void createRestaurant_DuplicateSlug_Returns409() throws Exception {
        RestaurantDto dto1 = new RestaurantDto(null, "Restaurant 1", "same-slug", "Desc 1");
        mockMvc.perform(post("/api/restaurants")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto1)))
                .andExpect(status().isOk());

        RestaurantDto dto2 = new RestaurantDto(null, "Restaurant 2", "same-slug", "Desc 2");
        mockMvc.perform(post("/api/restaurants")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Slug already exists"));
    }

    @Test
    void createRestaurant_Unauthorized_Returns403() throws Exception {
        RestaurantDto dto = new RestaurantDto(null, "My Restaurant", "my-restaurant", "Great food");

        mockMvc.perform(post("/api/restaurants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void listRestaurants_Success() throws Exception {
        // Create restaurants
        RestaurantDto dto1 = new RestaurantDto(null, "Restaurant 1", "rest-1", "Desc 1");
        RestaurantDto dto2 = new RestaurantDto(null, "Restaurant 2", "rest-2", "Desc 2");

        mockMvc.perform(post("/api/restaurants")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto1)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/restaurants")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto2)))
                .andExpect(status().isOk());

        // List restaurants
        mockMvc.perform(get("/api/restaurants")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void updateRestaurant_Success() throws Exception {
        // Create restaurant
        RestaurantDto createDto = new RestaurantDto(null, "Original Name", "original-slug", "Original Desc");
        MvcResult result = mockMvc.perform(post("/api/restaurants")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isOk())
                .andReturn();

        Long restaurantId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        // Update restaurant
        RestaurantDto updateDto = new RestaurantDto(null, "Updated Name", "updated-slug", "Updated Desc");
        mockMvc.perform(put("/api/restaurants/" + restaurantId)
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"))
                .andExpect(jsonPath("$.slug").value("updated-slug"));
    }

    @Test
    void deleteRestaurant_Success() throws Exception {
        // Create restaurant
        RestaurantDto dto = new RestaurantDto(null, "To Delete", "to-delete", "Will be deleted");
        MvcResult result = mockMvc.perform(post("/api/restaurants")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andReturn();

        Long restaurantId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        // Delete restaurant
        mockMvc.perform(delete("/api/restaurants/" + restaurantId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isNoContent());

        assertThat(restaurantRepository.findById(restaurantId)).isEmpty();
    }

    @Test
    void updateRestaurant_NotOwner_Returns403() throws Exception {
        // Create restaurant with first user
        RestaurantDto dto = new RestaurantDto(null, "Restaurant", "rest-slug", "Desc");
        MvcResult result = mockMvc.perform(post("/api/restaurants")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andReturn();

        Long restaurantId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        // Register another user
        RegisterRequest otherUser = new RegisterRequest("other@test.com", "password123", "Other");
        MvcResult otherResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(otherUser)))
                .andExpect(status().isOk())
                .andReturn();

        String otherToken = objectMapper.readTree(otherResult.getResponse().getContentAsString()).get("token").asText();

        // Try to update restaurant with other user
        RestaurantDto updateDto = new RestaurantDto(null, "Hacked", "hacked", "Hacked");
        mockMvc.perform(put("/api/restaurants/" + restaurantId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isForbidden());
    }
}
