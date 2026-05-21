package com.qrmenu.controller;

import com.qrmenu.dto.RestaurantDto;
import com.qrmenu.entity.User;
import com.qrmenu.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    @GetMapping
    public ResponseEntity<List<RestaurantDto>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(restaurantService.getByUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantDto> get(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(restaurantService.getById(id, user));
    }

    @PostMapping
    public ResponseEntity<RestaurantDto> create(
            @Valid @RequestBody RestaurantDto dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(restaurantService.create(dto, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantDto> update(
            @PathVariable Long id,
            @Valid @RequestBody RestaurantDto dto,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(restaurantService.update(id, dto, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        restaurantService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
