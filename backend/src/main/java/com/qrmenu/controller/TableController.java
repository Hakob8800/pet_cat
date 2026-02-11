package com.qrmenu.controller;

import com.qrmenu.dto.TableDto;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.entity.RestaurantTable;
import com.qrmenu.entity.User;
import com.qrmenu.repository.TableRepository;
import com.qrmenu.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TableController {

    private final TableRepository tableRepository;
    private final RestaurantService restaurantService;

    @GetMapping("/api/restaurants/{restaurantId}/tables")
    public ResponseEntity<List<TableDto>> list(
            @PathVariable Long restaurantId,
            @AuthenticationPrincipal User user) {
        restaurantService.getOwnedRestaurant(restaurantId, user);
        List<TableDto> tables = tableRepository.findByRestaurantIdOrderByNumberAsc(restaurantId)
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(tables);
    }

    @PostMapping("/api/restaurants/{restaurantId}/tables")
    public ResponseEntity<TableDto> create(
            @PathVariable Long restaurantId,
            @Valid @RequestBody TableDto dto,
            @AuthenticationPrincipal User user) {
        Restaurant restaurant = restaurantService.getOwnedRestaurant(restaurantId, user);

        if (tableRepository.existsByRestaurantIdAndNumber(restaurantId, dto.number())) {
            throw new RuntimeException("Table with this number already exists");
        }

        RestaurantTable table = new RestaurantTable();
        table.setNumber(dto.number());
        table.setRestaurant(restaurant);
        table.setIsActive(dto.isActive() != null ? dto.isActive() : true);

        return ResponseEntity.ok(toDto(tableRepository.save(table)));
    }

    @PutMapping("/api/tables/{id}")
    public ResponseEntity<TableDto> update(
            @PathVariable Long id,
            @Valid @RequestBody TableDto dto,
            @AuthenticationPrincipal User user) {
        RestaurantTable table = getOwnedTable(id, user);

        if (dto.number() != null) {
            table.setNumber(dto.number());
        }
        if (dto.isActive() != null) {
            table.setIsActive(dto.isActive());
        }

        return ResponseEntity.ok(toDto(tableRepository.save(table)));
    }

    @DeleteMapping("/api/tables/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        RestaurantTable table = getOwnedTable(id, user);
        tableRepository.delete(table);
        return ResponseEntity.noContent().build();
    }

    private RestaurantTable getOwnedTable(Long id, User user) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found"));

        if (!table.getRestaurant().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        return table;
    }

    private TableDto toDto(RestaurantTable t) {
        return new TableDto(t.getId(), t.getNumber(), t.getQrCodeUrl(), t.getIsActive());
    }
}
