# QR Menu SaaS

Система цифрового меню для ресторанов с QR-кодами и онлайн-заказами.

## Технологии

### Backend
- **Java 17**
- **Spring Boot 3.2**
- **Spring Data JPA** — ORM
- **Spring Security** — JWT авторизация
- **PostgreSQL** — база данных
- **Lombok** — генерация кода
- **Maven** — сборка

### Frontend
- **React 18** + **TypeScript**
- **Vite** — сборка
- **React Router** — маршрутизация
- **React Hook Form** + **Zod** — валидация форм
- **@dnd-kit** — drag & drop
- **qrcode.react** — генерация QR-кодов
- **Tailwind CSS** — стили
- **Axios** — HTTP клиент

---

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│   PostgreSQL    │
│   (React/Vite)  │     │  (Spring Boot)  │     │                 │
│   localhost:5173│     │  localhost:8080 │     │   localhost:5432│
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## База данных

### ER-диаграмма

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │  Restaurant  │       │   Category   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │──┐    │ id           │──┐    │ id           │
│ email        │  │    │ name         │  │    │ name         │
│ password     │  │    │ slug         │  │    │ position     │
│ name         │  └───▶│ description  │  └───▶│ restaurant_id│
│ createdAt    │       │ user_id      │       └──────┬───────┘
└──────────────┘       │ createdAt    │              │
                       └──────┬───────┘              │
                              │                      │
        ┌─────────────────────┼──────────────────────┘
        │                     │
        ▼                     ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Table     │       │   MenuItem   │       │    Order     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ number       │       │ name         │       │ status       │
│ isActive     │       │ description  │       │ createdAt    │
│ qrCodeUrl    │       │ price        │       │ restaurant_id│
│ restaurant_id│       │ imageUrl     │       │ table_id     │
└──────┬───────┘       │ available    │       └──────┬───────┘
       │               │ position     │              │
       │               │ category_id  │              │
       │               └──────┬───────┘              │
       │                      │                      │
       │                      │                      ▼
       │                      │              ┌──────────────┐
       │                      │              │  OrderItem   │
       │                      │              ├──────────────┤
       │                      └─────────────▶│ id           │
       │                                     │ quantity     │
       └────────────────────────────────────▶│ order_id     │
                                             │ menu_item_id │
                                             └──────────────┘
```

### Сущности

#### User (Пользователь)
| Поле | Тип | Описание |
|------|-----|----------|
| id | Long | PK |
| email | String | Уникальный email |
| password | String | BCrypt хеш |
| name | String | Имя |
| createdAt | LocalDateTime | Дата регистрации |

#### Restaurant (Ресторан)
| Поле | Тип | Описание |
|------|-----|----------|
| id | Long | PK |
| name | String | Название |
| slug | String | URL-friendly идентификатор (уникальный) |
| description | String | Описание |
| user_id | Long | FK → User |
| createdAt | LocalDateTime | Дата создания |

#### Category (Категория меню)
| Поле | Тип | Описание |
|------|-----|----------|
| id | Long | PK |
| name | String | Название |
| position | Integer | Порядок сортировки |
| restaurant_id | Long | FK → Restaurant |

#### MenuItem (Блюдо)
| Поле | Тип | Описание |
|------|-----|----------|
| id | Long | PK |
| name | String | Название |
| description | String | Описание |
| price | BigDecimal | Цена |
| imageUrl | String | URL изображения |
| available | Boolean | Доступно для заказа |
| position | Integer | Порядок сортировки |
| category_id | Long | FK → Category |

#### RestaurantTable (Стол)
| Поле | Тип | Описание |
|------|-----|----------|
| id | Long | PK |
| number | Integer | Номер стола |
| isActive | Boolean | Активен (принимает заказы) |
| qrCodeUrl | String | URL QR-кода (опционально) |
| restaurant_id | Long | FK → Restaurant |

#### Order (Заказ)
| Поле | Тип | Описание |
|------|-----|----------|
| id | Long | PK |
| status | OrderStatus | NEW / DONE |
| createdAt | LocalDateTime | Время создания |
| restaurant_id | Long | FK → Restaurant |
| table_id | Long | FK → RestaurantTable |

#### OrderItem (Позиция заказа)
| Поле | Тип | Описание |
|------|-----|----------|
| id | Long | PK |
| quantity | Integer | Количество |
| order_id | Long | FK → Order |
| menu_item_id | Long | FK → MenuItem |

---

## API Endpoints

### Аутентификация

| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| POST | `/api/auth/register` | Регистрация | - |
| POST | `/api/auth/login` | Вход | - |

**Register Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Auth Response:**
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "userId": 1,
  "email": "john@example.com",
  "name": "John Doe"
}
```

---

### Рестораны

| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| GET | `/api/restaurants` | Список ресторанов пользователя | JWT |
| POST | `/api/restaurants` | Создать ресторан | JWT |
| PUT | `/api/restaurants/{id}` | Обновить ресторан | JWT |
| DELETE | `/api/restaurants/{id}` | Удалить ресторан | JWT |

**Restaurant DTO:**
```json
{
  "id": 1,
  "name": "My Restaurant",
  "slug": "my-restaurant",
  "description": "Best food in town"
}
```

---

### Категории

| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| GET | `/api/restaurants/{id}/categories` | Список категорий | JWT |
| POST | `/api/restaurants/{id}/categories` | Создать категорию | JWT |
| PUT | `/api/categories/{id}` | Обновить категорию | JWT |
| DELETE | `/api/categories/{id}` | Удалить категорию | JWT |
| PUT | `/api/restaurants/{id}/categories/reorder` | Изменить порядок | JWT |

**Category DTO:**
```json
{
  "id": 1,
  "name": "Main Dishes",
  "position": 0
}
```

**Reorder Request:**
```json
{
  "items": [
    { "id": 2, "position": 0 },
    { "id": 1, "position": 1 }
  ]
}
```

---

### Блюда

| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| GET | `/api/categories/{id}/items` | Список блюд | JWT |
| POST | `/api/categories/{id}/items` | Создать блюдо | JWT |
| PUT | `/api/items/{id}` | Обновить блюдо | JWT |
| DELETE | `/api/items/{id}` | Удалить блюдо | JWT |
| PUT | `/api/categories/{id}/items/reorder` | Изменить порядок | JWT |

**MenuItem DTO:**
```json
{
  "id": 1,
  "name": "Pasta Carbonara",
  "description": "Classic Italian pasta",
  "price": 15.99,
  "imageUrl": "/api/files/abc123.jpg",
  "available": true,
  "position": 0
}
```

---

### Столы

| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| GET | `/api/restaurants/{id}/tables` | Список столов | JWT |
| POST | `/api/restaurants/{id}/tables` | Создать стол | JWT |
| PUT | `/api/tables/{id}` | Обновить стол | JWT |
| DELETE | `/api/tables/{id}` | Удалить стол | JWT |

**Table DTO:**
```json
{
  "id": 1,
  "number": 1,
  "isActive": true,
  "qrCodeUrl": null
}
```

---

### Файлы

| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| POST | `/api/files/upload` | Загрузить изображение | JWT |
| GET | `/api/files/{filename}` | Получить файл | - |

**Upload Response:**
```json
{
  "filename": "abc123.jpg",
  "url": "/api/files/abc123.jpg",
  "contentType": "image/jpeg",
  "size": 12345
}
```

**Ограничения:**
- Максимальный размер: 5MB
- Разрешённые типы: image/jpeg, image/png, image/webp

---

### Публичное меню

| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| GET | `/api/menu/{slug}` | Получить меню ресторана | - |

**Response:**
```json
{
  "restaurantName": "My Restaurant",
  "description": "Best food in town",
  "categories": [
    {
      "id": 1,
      "name": "Main Dishes",
      "items": [
        {
          "id": 1,
          "name": "Pasta",
          "description": "...",
          "price": 15.99,
          "imageUrl": "/api/files/abc.jpg"
        }
      ]
    }
  ]
}
```

---

### Заказы (Публичные)

| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| POST | `/api/public/orders` | Создать заказ | - |

**Request:**
```json
{
  "tableId": 1,
  "items": [
    { "menuItemId": 1, "quantity": 2 },
    { "menuItemId": 3, "quantity": 1 }
  ]
}
```

**Response:**
```json
{
  "orderId": 1,
  "status": "NEW",
  "message": "Order created successfully"
}
```

---

### Заказы (Админ)

| Метод | Endpoint | Описание | Auth |
|-------|----------|----------|------|
| GET | `/api/admin/orders?restaurantId={id}` | Список заказов | JWT |
| PUT | `/api/admin/orders/{id}/status?restaurantId={id}` | Изменить статус | JWT |

**Order DTO:**
```json
{
  "id": 1,
  "tableNumber": 5,
  "status": "NEW",
  "createdAt": "2024-01-15T14:30:00",
  "items": [
    {
      "id": 1,
      "menuItemId": 1,
      "menuItemName": "Pasta",
      "price": 15.99,
      "quantity": 2
    }
  ]
}
```

**Update Status Request:**
```json
{
  "status": "DONE"
}
```

---

## Frontend

### Страницы

| Путь | Компонент | Описание | Auth |
|------|-----------|----------|------|
| `/login` | Login | Страница входа | - |
| `/register` | Register | Страница регистрации | - |
| `/menu/{slug}` | PublicMenu | Публичное меню | - |
| `/menu/{slug}?table={id}` | PublicMenu | Меню с корзиной | - |
| `/admin` | Dashboard | Список ресторанов | JWT |
| `/admin/restaurant/{id}` | RestaurantEdit | Настройки и столы | JWT |
| `/admin/restaurant/{id}/menu` | MenuEdit | Редактор меню | JWT |
| `/admin/restaurant/{id}/orders` | Orders | Управление заказами | JWT |

### Компоненты

| Компонент | Описание |
|-----------|----------|
| `FormField` | Поле формы с валидацией |
| `ImageUpload` | Загрузка изображений с превью |
| `MenuItemCard` | Карточка блюда |
| `CategorySection` | Секция категории с блюдами |
| `Cart` | Корзина заказа |
| `SortableCategory` | Перетаскиваемая категория |
| `SortableItem` | Перетаскиваемое блюдо |
| `QRCodeGenerator` | Генератор QR-кодов |

### Контексты

| Контекст | Описание |
|----------|----------|
| `AuthContext` | Авторизация (user, token, login, logout) |
| `CartContext` | Корзина (items, addItem, removeItem, clearCart) |

---

## Функциональность

### Для владельца ресторана

1. **Регистрация и вход**
   - Регистрация по email/пароль
   - JWT авторизация

2. **Управление ресторанами**
   - Создание нескольких ресторанов
   - Уникальный slug для каждого (URL меню)
   - Редактирование и удаление

3. **Управление меню**
   - Создание категорий (Закуски, Основные блюда, Напитки...)
   - Добавление блюд с ценой, описанием, фото
   - Drag & Drop сортировка категорий и блюд
   - Включение/выключение доступности блюд

4. **Управление столами**
   - Создание столов с номерами
   - Активация/деактивация столов
   - QR-код для каждого стола
   - Скачивание QR-кодов в PNG

5. **Управление заказами**
   - Просмотр новых заказов в реальном времени
   - Информация: стол, блюда, количество, сумма, время
   - Отметка заказа как выполненного
   - Автообновление каждые 30 секунд

### Для гостя ресторана

1. **Просмотр меню**
   - Сканирование QR-кода на столе
   - Просмотр категорий и блюд
   - Фото, описание, цены

2. **Оформление заказа**
   - Добавление блюд в корзину
   - Изменение количества
   - Автоматическое определение стола из QR
   - Подтверждение заказа
   - Экран успешного заказа

---

## Установка и запуск

### Требования

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.8+

### База данных

```bash
# Через Docker
docker-compose up -d

# Или вручную создать БД
createdb qrmenu
```

### Backend

```bash
cd backend

# Настроить application.yml (БД, JWT secret)

# Запуск
mvn spring-boot:run
```

### Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Запуск
npm run dev
```

### Доступ

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Публичное меню: http://localhost:5173/menu/{slug}?table={id}

---

## Конфигурация

### Backend (application.yml)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/qrmenu
    username: postgres
    password: postgres

  jpa:
    hibernate:
      ddl-auto: update

  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 5MB

jwt:
  secret: your-secret-key-min-32-characters
  expiration: 86400000  # 24 hours

file:
  upload-dir: ./uploads
```

### Frontend (vite.config.ts)

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
```

---

## Структура проекта

```
pet_cat/
├── backend/
│   ├── src/main/java/com/qrmenu/
│   │   ├── config/
│   │   │   ├── SecurityConfig.java
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── RestaurantController.java
│   │   │   ├── CategoryController.java
│   │   │   ├── MenuItemController.java
│   │   │   ├── TableController.java
│   │   │   ├── FileUploadController.java
│   │   │   ├── PublicMenuController.java
│   │   │   ├── PublicOrderController.java
│   │   │   └── AdminOrderController.java
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── RestaurantEdit.tsx
│   │   │   │   ├── MenuEdit.tsx
│   │   │   │   └── Orders.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── PublicMenu.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Git История

```
c4c2b1c Remove generic QR from dashboard, QR codes are per-table only
c196d74 Change table selection to QR code based
acf3f9a Add tables management to restaurant settings
0785c84 Add frontend for order system
0887896 Add order system with tables, orders, and order items
c3a8808 Fix code quality issues and add error handling
71b421e Add form validation, image upload, and drag-and-drop reordering
6756fcb Initial commit: QR Menu SaaS MVP
```

---

## Лицензия

MIT
