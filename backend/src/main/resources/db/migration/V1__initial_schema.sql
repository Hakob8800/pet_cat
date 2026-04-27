CREATE TABLE users (
    id         BIGSERIAL    PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE restaurants (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP    DEFAULT NOW(),
    user_id     BIGINT       NOT NULL REFERENCES users (id)
);

CREATE TABLE categories (
    id            BIGSERIAL    PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    position      INTEGER      DEFAULT 0,
    restaurant_id BIGINT       NOT NULL REFERENCES restaurants (id)
);

CREATE TABLE menu_items (
    id          BIGSERIAL      PRIMARY KEY,
    name        VARCHAR(255)   NOT NULL,
    description TEXT,
    price       NUMERIC(10, 2) NOT NULL,
    image_url   VARCHAR(255),
    available   BOOLEAN        DEFAULT TRUE,
    position    INTEGER        DEFAULT 0,
    category_id BIGINT         NOT NULL REFERENCES categories (id)
);

CREATE TABLE restaurant_tables (
    id            BIGSERIAL    PRIMARY KEY,
    number        INTEGER      NOT NULL,
    restaurant_id BIGINT       NOT NULL REFERENCES restaurants (id),
    qr_code_url   VARCHAR(255),
    is_active     BOOLEAN      DEFAULT TRUE
);

CREATE TABLE orders (
    id            BIGSERIAL   PRIMARY KEY,
    restaurant_id BIGINT      NOT NULL REFERENCES restaurants (id),
    table_id      BIGINT      NOT NULL REFERENCES restaurant_tables (id),
    status        VARCHAR(50) NOT NULL DEFAULT 'NEW',
    created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT    NOT NULL REFERENCES orders (id),
    menu_item_id BIGINT    NOT NULL REFERENCES menu_items (id),
    quantity     INTEGER   NOT NULL
);
