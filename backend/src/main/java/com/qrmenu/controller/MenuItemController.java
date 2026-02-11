package com.qrmenu.controller;

import com.qrmenu.dto.MenuItemDto;
import com.qrmenu.dto.ReorderRequest;
import com.qrmenu.entity.Category;
import com.qrmenu.entity.MenuItem;
import com.qrmenu.entity.User;
import com.qrmenu.repository.CategoryRepository;
import com.qrmenu.repository.MenuItemRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping("/api/categories/{categoryId}/items")
    public ResponseEntity<List<MenuItemDto>> list(
            @PathVariable Long categoryId,
            @AuthenticationPrincipal User user) {
        getOwnedCategory(categoryId, user);
        List<MenuItemDto> items = menuItemRepository.findByCategoryIdOrderByPositionAsc(categoryId)
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(items);
    }

    @PostMapping("/api/categories/{categoryId}/items")
    public ResponseEntity<MenuItemDto> create(
            @PathVariable Long categoryId,
            @Valid @RequestBody MenuItemDto dto,
            @AuthenticationPrincipal User user) {
        Category category = getOwnedCategory(categoryId, user);

        MenuItem item = new MenuItem();
        item.setName(dto.name());
        item.setDescription(dto.description());
        item.setPrice(dto.price());
        item.setImageUrl(dto.imageUrl());
        item.setAvailable(dto.available() != null ? dto.available() : true);
        item.setPosition(dto.position() != null ? dto.position() : 0);
        item.setCategory(category);

        return ResponseEntity.ok(toDto(menuItemRepository.save(item)));
    }

    @PutMapping("/api/items/{id}")
    public ResponseEntity<MenuItemDto> update(
            @PathVariable Long id,
            @Valid @RequestBody MenuItemDto dto,
            @AuthenticationPrincipal User user) {
        MenuItem item = getOwnedItem(id, user);

        item.setName(dto.name());
        item.setDescription(dto.description());
        item.setPrice(dto.price());
        item.setImageUrl(dto.imageUrl());
        item.setAvailable(dto.available() != null ? dto.available() : item.getAvailable());
        item.setPosition(dto.position() != null ? dto.position() : item.getPosition());

        return ResponseEntity.ok(toDto(menuItemRepository.save(item)));
    }

    @DeleteMapping("/api/items/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        MenuItem item = getOwnedItem(id, user);
        menuItemRepository.delete(item);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/categories/{categoryId}/items/reorder")
    @Transactional
    public ResponseEntity<Void> reorder(
            @PathVariable Long categoryId,
            @RequestBody ReorderRequest request,
            @AuthenticationPrincipal User user) {
        Category category = getOwnedCategory(categoryId, user);

        for (ReorderRequest.ReorderItem item : request.items()) {
            MenuItem menuItem = menuItemRepository.findById(item.id())
                    .orElseThrow(() -> new RuntimeException("Item not found"));
            if (!menuItem.getCategory().getId().equals(categoryId)) {
                throw new RuntimeException("Item does not belong to this category");
            }
            menuItem.setPosition(item.position());
            menuItemRepository.save(menuItem);
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

    private MenuItem getOwnedItem(Long id, User user) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (!item.getCategory().getRestaurant().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        return item;
    }

    private MenuItemDto toDto(MenuItem m) {
        return new MenuItemDto(
                m.getId(),
                m.getName(),
                m.getDescription(),
                m.getPrice(),
                m.getImageUrl(),
                m.getAvailable(),
                m.getPosition()
        );
    }
}
