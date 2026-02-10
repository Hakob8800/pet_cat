package com.qrmenu.repository;

import com.qrmenu.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    List<Restaurant> findByUserId(Long userId);
    Optional<Restaurant> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
