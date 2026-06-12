import { test, expect } from '@playwright/test'

test.describe('Live chat', () => {
  const baseURL = 'http://localhost:3000'
  const adminEmail = 'admin@test.com'
  const adminPassword = 'admin'

  test('guest can start chat and admin can reply', async ({ browser, request }) => {
    const guestContext = await browser.newContext()
    const guestPage = await guestContext.newPage()

    await guestPage.goto(baseURL)
    await guestPage.getByRole('button', { name: /open shopping assistant|open chat/i }).click()
    await expect(guestPage.getByText('AI Shopping Assistant')).toBeVisible()

    const guestMessage = `Guest message ${Date.now()}`
    await guestPage.getByPlaceholder(/ask about products/i).fill(guestMessage)
    await guestPage.getByRole('button', { name: /send message/i }).click()

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

  test('chat composer shows voice input when speech recognition is available', async ({ page }) => {
    await page.addInitScript(() => {
      class MockSpeechRecognition {
        continuous = false
        interimResults = false
        lang = 'en-US'
        maxAlternatives = 1
        onend: (() => void) | null = null
        onerror: ((event: { error: string }) => void) | null = null
        onresult: ((event: unknown) => void) | null = null
        onstart: (() => void) | null = null
        start() {
          this.onstart?.()
        }
        stop() {
          this.onend?.()
        }
        abort() {
          this.onerror?.({ error: 'aborted' })
        }
      }

      window.SpeechRecognition = MockSpeechRecognition as typeof window.SpeechRecognition
      window.webkitSpeechRecognition = MockSpeechRecognition as typeof window.webkitSpeechRecognition
    })

    await page.goto(baseURL)
    await page.getByRole('button', { name: /open shopping assistant|open chat/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('button', { name: /start voice input/i })).toBeVisible()

    const textarea = page.getByLabel(/message the shopping assistant/i)
    await textarea.fill('voice test query')
    await expect(textarea).toHaveValue('voice test query')
  })
})
