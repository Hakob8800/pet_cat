package com.qrmenu.service;

import com.qrmenu.dto.RestaurantDto;
import com.qrmenu.entity.Restaurant;
import com.qrmenu.entity.User;
import com.qrmenu.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public List<RestaurantDto> getByUser(User user) {
        return restaurantRepository.findByUserId(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    public RestaurantDto create(RestaurantDto dto, User user) {
        if (restaurantRepository.existsBySlug(dto.slug())) {
            throw new RuntimeException("Slug already exists");
        }

        Restaurant restaurant = new Restaurant();
        restaurant.setName(dto.name());
        restaurant.setSlug(dto.slug());
        restaurant.setDescription(dto.description());
        restaurant.setUser(user);

        return toDto(restaurantRepository.save(restaurant));
    }

    public RestaurantDto update(Long id, RestaurantDto dto, User user) {
        Restaurant restaurant = getOwnedRestaurant(id, user);

        // Check slug uniqueness if changed
        if (!restaurant.getSlug().equals(dto.slug()) && restaurantRepository.existsBySlug(dto.slug())) {
            throw new RuntimeException("Slug already exists");
        }

        restaurant.setName(dto.name());
        restaurant.setSlug(dto.slug());
        restaurant.setDescription(dto.description());

        return toDto(restaurantRepository.save(restaurant));
    }

    public void delete(Long id, User user) {
        Restaurant restaurant = getOwnedRestaurant(id, user);
        restaurantRepository.delete(restaurant);
    }

    public Restaurant getOwnedRestaurant(Long id, User user) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        if (!restaurant.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        return restaurant;
    }

    private RestaurantDto toDto(Restaurant r) {
        return new RestaurantDto(r.getId(), r.getName(), r.getSlug(), r.getDescription());
    }
}
