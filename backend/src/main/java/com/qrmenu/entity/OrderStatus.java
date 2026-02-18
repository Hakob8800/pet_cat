package com.qrmenu.entity;

public enum OrderStatus {
    NEW,
    CONFIRMED,
    PREPARING,
    READY,
    DONE;

    public OrderStatus next() {
        return switch (this) {
            case NEW -> CONFIRMED;
            case CONFIRMED -> PREPARING;
            case PREPARING -> READY;
            case READY -> DONE;
            case DONE -> throw new IllegalStateException("DONE is the final status");
        };
    }

    public boolean canTransitionTo(OrderStatus target) {
        if (this == DONE) return false;
        return target == this.next();
    }
}
