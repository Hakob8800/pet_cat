package com.qrmenu.repository;

import com.qrmenu.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.table JOIN FETCH o.items i JOIN FETCH i.menuItem WHERE o.restaurant.id = :restaurantId ORDER BY o.createdAt DESC")
    List<Order> findByRestaurantIdWithDetails(Long restaurantId);

    @Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.table JOIN FETCH o.items i JOIN FETCH i.menuItem WHERE o.id = :orderId")
    Optional<Order> findByIdWithDetails(Long orderId);
}
