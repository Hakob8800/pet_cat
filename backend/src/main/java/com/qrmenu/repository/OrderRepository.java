package com.qrmenu.repository;

import com.qrmenu.entity.Order;
import com.qrmenu.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.table JOIN FETCH o.items i JOIN FETCH i.menuItem WHERE o.restaurant.id = :restaurantId ORDER BY o.createdAt DESC")
    List<Order> findByRestaurantIdWithDetails(Long restaurantId);

    @Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.table JOIN FETCH o.items i JOIN FETCH i.menuItem WHERE o.id = :orderId")
    Optional<Order> findByIdWithDetails(Long orderId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.createdAt BETWEEN :from AND :to")
    long countByRestaurantAndPeriod(Long restaurantId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(oi.priceAtOrder * oi.quantity), 0) FROM OrderItem oi WHERE oi.order.restaurant.id = :restaurantId AND oi.order.createdAt BETWEEN :from AND :to")
    java.math.BigDecimal sumRevenueByRestaurantAndPeriod(Long restaurantId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status <> :status")
    long countActiveOrders(Long restaurantId, OrderStatus status);

    @Query("""
            SELECT oi.menuItem.name, SUM(oi.quantity), SUM(oi.priceAtOrder * oi.quantity)
            FROM OrderItem oi
            WHERE oi.order.restaurant.id = :restaurantId
              AND oi.order.createdAt BETWEEN :from AND :to
            GROUP BY oi.menuItem.id, oi.menuItem.name
            ORDER BY SUM(oi.quantity) DESC
            """)
    List<Object[]> findTopItemsByRestaurantAndPeriod(Long restaurantId, LocalDateTime from, LocalDateTime to, org.springframework.data.domain.Pageable pageable);

    @Query("""
            SELECT CAST(o.createdAt AS date), SUM(oi.priceAtOrder * oi.quantity), COUNT(DISTINCT o.id)
            FROM Order o JOIN o.items oi
            WHERE o.restaurant.id = :restaurantId
              AND o.createdAt BETWEEN :from AND :to
            GROUP BY CAST(o.createdAt AS date)
            ORDER BY CAST(o.createdAt AS date)
            """)
    List<Object[]> findDailyStatsByRestaurantAndPeriod(Long restaurantId, LocalDateTime from, LocalDateTime to);
}
