package com.qrmenu.repository;

import com.qrmenu.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByRestaurantIdOrderByNumberAsc(Long restaurantId);
    boolean existsByRestaurantIdAndNumber(Long restaurantId, Integer number);
}
