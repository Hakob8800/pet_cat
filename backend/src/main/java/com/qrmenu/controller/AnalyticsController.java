package com.qrmenu.controller;

import com.qrmenu.dto.AnalyticsDto;
import com.qrmenu.entity.User;
import com.qrmenu.service.AnalyticsService;
import com.qrmenu.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final RestaurantService restaurantService;

    @GetMapping
    public ResponseEntity<AnalyticsDto> getAnalytics(
            @RequestParam Long restaurantId,
            @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal User user) {
        restaurantService.getOwnedRestaurant(restaurantId, user);
        if (days != 7 && days != 30) days = 7;
        return ResponseEntity.ok(analyticsService.getAnalytics(restaurantId, days));
    }
}
