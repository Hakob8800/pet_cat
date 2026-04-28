package com.qrmenu.controller;

import com.qrmenu.dto.TableDto;
import com.qrmenu.dto.WaiterCallDto;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.entity.RestaurantTable;
import com.qrmenu.repository.RestaurantRepository;
import com.qrmenu.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/public/tables")
@RequiredArgsConstructor
public class PublicTableController {

    private final RestaurantRepository restaurantRepository;
    private final TableRepository tableRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/{slug}")
    public ResponseEntity<List<TableDto>> getTablesBySlug(@PathVariable String slug) {
        Restaurant restaurant = restaurantRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        List<TableDto> tables = tableRepository.findByRestaurantIdOrderByNumberAsc(restaurant.getId())
                .stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsActive()))
                .map(t -> new TableDto(t.getId(), t.getNumber(), t.getQrCodeUrl(), t.getIsActive()))
                .toList();

        return ResponseEntity.ok(tables);
    }

    @PostMapping("/{tableId}/call-waiter")
    public ResponseEntity<Void> callWaiter(@PathVariable Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RuntimeException("Table not found"));

        if (!Boolean.TRUE.equals(table.getIsActive())) {
            throw new RuntimeException("Table is not active");
        }

        WaiterCallDto call = new WaiterCallDto(
                table.getId(),
                table.getNumber(),
                table.getRestaurant().getId(),
                LocalDateTime.now()
        );

        messagingTemplate.convertAndSend(
                "/topic/restaurants/" + table.getRestaurant().getId() + "/waiter-calls",
                call
        );

        return ResponseEntity.ok().build();
    }
}
