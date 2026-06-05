import { test, expect } from '@playwright/test'

test.describe('Live chat', () => {
  const baseURL = 'http://localhost:3000'
  const adminEmail = 'admin@test.com'
  const adminPassword = 'admin'

  test('guest can start chat and admin can reply', async ({ browser, request }) => {
    const guestContext = await browser.newContext()
    const guestPage = await guestContext.newPage()

    await guestPage.goto(baseURL)
    await guestPage.getByRole('button', { name: /open chat/i }).click()
    await expect(guestPage.getByText('Live support')).toBeVisible()

    const guestMessage = `Guest message ${Date.now()}`
    await guestPage.getByPlaceholder('Type your message...').fill(guestMessage)
    await guestPage.getByRole('button').filter({ has: guestPage.locator('svg') }).last().click()

    await expect(guestPage.getByText(guestMessage)).toBeVisible({ timeout: 10000 })

    const loginRes = await request.post(`${baseURL}/api/users/login`, {
      data: { email: adminEmail, password: adminPassword },
    })
    expect(loginRes.ok()).toBeTruthy()

    const adminContext = await browser.newContext()
    await adminContext.addCookies(
      (await request.storageState()).cookies.map((cookie) => ({
        ...cookie,
        domain: 'localhost',
        path: '/',
      })),
    )

    const adminPage = await adminContext.newPage()
    await adminPage.goto(`${baseURL}/admin/support`)
    await expect(adminPage.getByRole('heading', { name: 'Support inbox' })).toBeVisible()

    await adminPage.getByText(guestMessage).click()
    const agentReply = `Agent reply ${Date.now()}`
    await adminPage.getByPlaceholder('Reply to customer...').fill(agentReply)
    await adminPage.getByRole('button').filter({ has: adminPage.locator('svg') }).last().click()

    await expect(guestPage.getByText(agentReply)).toBeVisible({ timeout: 15000 })

    await guestContext.close()
    await adminContext.close()
  })
})
