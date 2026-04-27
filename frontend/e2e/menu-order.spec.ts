import { test, expect } from '@playwright/test'

const MOCK_MENU = {
  restaurantName: 'Test Bistro',
  description: 'A great place to eat',
  categories: [
    {
      id: 1,
      name: 'Starters',
      items: [
        { id: 101, name: 'Spring Rolls', description: 'Crispy and delicious', price: 8, available: true },
        { id: 102, name: 'Tomato Soup', description: 'Hot and fresh', price: 6, available: true },
      ],
    },
    {
      id: 2,
      name: 'Mains',
      items: [
        { id: 201, name: 'Cheese Burger', description: 'Classic beef burger', price: 15, available: true },
      ],
    },
  ],
}

test.describe('Public Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/api\/menu\/.*/, (route) =>
      route.fulfill({ json: MOCK_MENU })
    )
    await page.goto('/menu/test-bistro?table=5')
  })

  test('shows restaurant name, table number and menu items', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Test Bistro' })).toBeVisible()
    await expect(page.getByText('Table 5')).toBeVisible()
    await expect(page.getByText('Spring Rolls')).toBeVisible()
    await expect(page.getByText('Cheese Burger')).toBeVisible()
  })

  test('shows category tabs when there are multiple categories', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Starters' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mains' })).toBeVisible()
  })

  test('can add an item to the cart', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add' }).first().click()

    // Sticky cart bar appears with item count and price
    await expect(page.getByText('View Order')).toBeVisible()
    await expect(page.getByRole('button', { name: /View Order/ })).toContainText('$8')
  })

  test('can adjust quantity in cart', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add' }).first().click()
    // After adding, the card shows inline +/- controls
    await page.locator('[class*="rounded-full"]').filter({ hasText: '+' }).first().click()

    // Cart bar should now show 2 items ($16)
    await expect(page.getByText('$16')).toBeVisible()
  })
})

test.describe('Order placement', () => {
  test('places an order and shows the order tracker', async ({ page }) => {
    await page.route(/\/api\/menu\/.*/, (route) =>
      route.fulfill({ json: MOCK_MENU })
    )
    await page.route(/\/api\/public\/orders$/, (route) =>
      route.fulfill({ json: { orderId: 42, restaurantId: 1 } })
    )
    await page.route(/\/api\/public\/orders\/\d+/, (route) =>
      route.fulfill({ json: { status: 'NEW', items: [] } })
    )

    await page.goto('/menu/test-bistro?table=5')

    // Add item to cart
    await page.getByRole('button', { name: '+ Add' }).first().click()

    // Open cart modal
    await page.getByText('View Order').click()

    // Verify table info and item inside the modal
    await expect(page.getByText('Table 5').first()).toBeVisible()
    await expect(page.getByText('Spring Rolls').nth(1)).toBeVisible()

    // Place the order
    await page.getByRole('button', { name: 'Place Order' }).click()

    // OrderTracker should appear
    await expect(page.getByText('Order #42')).toBeVisible()
    await expect(page.getByText('Order Placed')).toBeVisible()
  })
})
