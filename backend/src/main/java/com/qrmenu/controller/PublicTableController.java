package com.qrmenu.controller;

import com.qrmenu.dto.TableDto;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.repository.RestaurantRepository;
import com.qrmenu.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/tables")
@RequiredArgsConstructor
public class PublicTableController {

    private final RestaurantRepository restaurantRepository;
    private final TableRepository tableRepository;

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
}
