package com.qrmenu.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AnalyticsDto(
        Summary summary,
        List<TopItem> topItems,
        List<DailyStat> revenueByDay
) {
    public record Summary(
            long todayOrders,
            BigDecimal todayRevenue,
            long activeOrders,
            long weekOrders,
            BigDecimal weekRevenue
    ) {}

    public record TopItem(
            String name,
            long totalQuantity,
            BigDecimal totalRevenue
    ) {}

    public record DailyStat(
            LocalDate date,
            BigDecimal revenue,
            long orderCount
    ) {}
}
