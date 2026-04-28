package com.qrmenu.service;

import com.qrmenu.dto.AnalyticsDto;
import com.qrmenu.entity.OrderStatus;
import com.qrmenu.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public AnalyticsDto getAnalytics(Long restaurantId, int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);
        LocalDateTime periodStart = todayStart.minusDays(days - 1);

        // Summary
        long todayOrders = orderRepository.countByRestaurantAndPeriod(restaurantId, todayStart, now);
        BigDecimal todayRevenue = orderRepository.sumRevenueByRestaurantAndPeriod(restaurantId, todayStart, now);
        long activeOrders = orderRepository.countActiveOrders(restaurantId, OrderStatus.DONE);
        long weekOrders = orderRepository.countByRestaurantAndPeriod(restaurantId, periodStart, now);
        BigDecimal weekRevenue = orderRepository.sumRevenueByRestaurantAndPeriod(restaurantId, periodStart, now);

        AnalyticsDto.Summary summary = new AnalyticsDto.Summary(
                todayOrders, todayRevenue, activeOrders, weekOrders, weekRevenue
        );

        // Top items
        List<Object[]> topRaw = orderRepository.findTopItemsByRestaurantAndPeriod(
                restaurantId, periodStart, now, PageRequest.of(0, 5)
        );
        List<AnalyticsDto.TopItem> topItems = topRaw.stream()
                .map(row -> new AnalyticsDto.TopItem(
                        (String) row[0],
                        ((Number) row[1]).longValue(),
                        (BigDecimal) row[2]
                ))
                .toList();

        // Daily stats — fill in missing days with zeros
        List<Object[]> dailyRaw = orderRepository.findDailyStatsByRestaurantAndPeriod(
                restaurantId, periodStart, now
        );
        Map<LocalDate, Object[]> byDate = dailyRaw.stream()
                .collect(Collectors.toMap(row -> toLocalDate(row[0]), row -> row));

        List<AnalyticsDto.DailyStat> revenueByDay = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            Object[] row = byDate.get(date);
            BigDecimal revenue = row != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            long count = row != null ? ((Number) row[2]).longValue() : 0L;
            revenueByDay.add(new AnalyticsDto.DailyStat(date, revenue, count));
        }

        return new AnalyticsDto(summary, topItems, revenueByDay);
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate ld) return ld;
        if (value instanceof java.sql.Date sd) return sd.toLocalDate();
        throw new IllegalArgumentException("Cannot convert to LocalDate: " + value.getClass());
    }
}
