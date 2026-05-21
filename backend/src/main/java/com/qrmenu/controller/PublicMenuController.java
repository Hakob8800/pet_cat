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
                                .sorted((a, b) -> {
                                    boolean aAvail = Boolean.TRUE.equals(a.getAvailable());
                                    boolean bAvail = Boolean.TRUE.equals(b.getAvailable());
                                    if (aAvail != bAvail) return aAvail ? -1 : 1;
                                    int posA = a.getPosition() != null ? a.getPosition() : 0;
                                    int posB = b.getPosition() != null ? b.getPosition() : 0;
                                    return Integer.compare(posA, posB);
                                })
                                .map(item -> new PublicMenuDto.Item(
                                        item.getId(),
                                        item.getName(),
                                        item.getDescription(),
                                        item.getPrice(),
                                        item.getImageUrl(),
                                        item.getAvailable()
                                ))
                                .toList()
                ))
                .toList();

        return ResponseEntity.ok(new PublicMenuDto(
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getCurrency() != null ? restaurant.getCurrency() : "$",
                categories
        ));
    }
}
