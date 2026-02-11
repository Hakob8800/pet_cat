package com.qrmenu.controller;

import com.qrmenu.dto.CategoryDto;
import com.qrmenu.dto.ReorderRequest;
import com.qrmenu.entity.Category;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.entity.User;
import com.qrmenu.repository.CategoryRepository;
import com.qrmenu.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final RestaurantService restaurantService;

    @GetMapping("/api/restaurants/{restaurantId}/categories")
    public ResponseEntity<List<CategoryDto>> list(
            @PathVariable Long restaurantId,
            @AuthenticationPrincipal User user) {
        restaurantService.getOwnedRestaurant(restaurantId, user);
        List<CategoryDto> categories = categoryRepository.findByRestaurantIdOrderByPositionAsc(restaurantId)
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(categories);
    }

    @PostMapping("/api/restaurants/{restaurantId}/categories")
    public ResponseEntity<CategoryDto> create(
            @PathVariable Long restaurantId,
            @Valid @RequestBody CategoryDto dto,
            @AuthenticationPrincipal User user) {
        Restaurant restaurant = restaurantService.getOwnedRestaurant(restaurantId, user);

        Category category = new Category();
        category.setName(dto.name());
        category.setPosition(dto.position() != null ? dto.position() : 0);
        category.setRestaurant(restaurant);

        return ResponseEntity.ok(toDto(categoryRepository.save(category)));
    }

    @PutMapping("/api/categories/{id}")
    public ResponseEntity<CategoryDto> update(
            @PathVariable Long id,
            @Valid @RequestBody CategoryDto dto,
            @AuthenticationPrincipal User user) {
        Category category = getOwnedCategory(id, user);

        category.setName(dto.name());
        category.setPosition(dto.position() != null ? dto.position() : category.getPosition());

        return ResponseEntity.ok(toDto(categoryRepository.save(category)));
    }

    @DeleteMapping("/api/categories/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        Category category = getOwnedCategory(id, user);
        categoryRepository.delete(category);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/restaurants/{restaurantId}/categories/reorder")
    public ResponseEntity<Void> reorder(
            @PathVariable Long restaurantId,
            @RequestBody ReorderRequest request,
            @AuthenticationPrincipal User user) {
        restaurantService.getOwnedRestaurant(restaurantId, user);

        for (ReorderRequest.ReorderItem item : request.items()) {
            Category category = categoryRepository.findById(item.id())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            if (!category.getRestaurant().getId().equals(restaurantId)) {
                throw new RuntimeException("Category does not belong to this restaurant");
            }
            category.setPosition(item.position());
            categoryRepository.save(category);
        }

        return ResponseEntity.ok().build();
    }

    private Category getOwnedCategory(Long id, User user) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getRestaurant().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        return category;
    }

    private CategoryDto toDto(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getPosition());
    }
}
