package com.qrmenu.dto;

import java.util.List;

public record ReorderRequest(List<ReorderItem> items) {
    public record ReorderItem(Long id, Integer position) {}
}
