package com.qrmenu.controller;

import com.qrmenu.dto.PublicMenuDto;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class PublicMenuController {

    private final RestaurantRepository restaurantRepository;

    @GetMapping("/{slug}")
    public ResponseEntity<PublicMenuDto> getMenu(@PathVariable String slug) {
        Restaurant restaurant = restaurantRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        List<PublicMenuDto.CategoryWithItems> categories = restaurant.getCategories().stream()
                .map(category -> new PublicMenuDto.CategoryWithItems(
                        category.getId(),
                        category.getName(),
                        category.getItems().stream()
                                .filter(item -> Boolean.TRUE.equals(item.getAvailable()))
                                .map(item -> new PublicMenuDto.Item(
                                        item.getId(),
                                        item.getName(),
                                        item.getDescription(),
                                        item.getPrice(),
                                        item.getImageUrl()
                                ))
                                .toList()
                ))
                .toList();

        return ResponseEntity.ok(new PublicMenuDto(
                restaurant.getName(),
                restaurant.getDescription(),
                categories
        ));
    }
}
