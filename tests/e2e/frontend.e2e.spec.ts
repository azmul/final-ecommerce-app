import path from 'path'
import { test, expect, Page } from '@playwright/test'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Frontend', () => {
  let page: Page
  const baseURL = 'http://localhost:3000'
  const mediaURL = `${baseURL}/admin/collections/media`
  const adminEmail = 'admin@test.com'
  const adminPassword = 'admin'
  const userEmail = 'user@test.com'
  const userPassword = 'user'
  const guestCheckoutPhone = '01712345678'
  const guestCheckoutEmail = 'phone.01712345678@example.com'
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000)
    const context = await browser.newContext()
    page = await context.newPage()
    await createUserAndLogin(page.request, adminEmail, adminPassword)
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto(baseURL)

    await expect(page).toHaveTitle(/Store/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Store')
  })

  test('can sign up and subsequently login', async ({ page }) => {
    await logoutAndExpectSuccess(page)

    await page.goto(`${baseURL}/create-account`)

    const fullNameInput = page.locator('input[name="fullName"]')
    const emailInput = page.locator('input[name="email"]')
    const phoneInput = page.locator('input[name="phone"]')
    const passwordInput = page.locator('input[name="password"]')
    const confirmPasswordInput = page.locator('input[name="passwordConfirm"]')
    const email = `test-${Date.now()}@test.com`
    const password = `test`

    await fullNameInput.fill('E2E Test User')
    await emailInput.fill(email)
    await phoneInput.fill('01700000000')
    await passwordInput.fill(password)
    await confirmPasswordInput.fill(password)

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    const successMessage = page.locator('text=Account created successfully')
    await expect(successMessage).toBeVisible()

    await logoutAndExpectSuccess(page)
    await loginFromUI(page, email, password)
  })

  test('can add products to cart', async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })
  })

  test('can add product with variant to cart', async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: 'Test Product With Variants',
      productSlug: 'test-product-variants',
      variant: 'Payload',
    })
  })

  test('can remove products from cart', async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })

    await removeFromCartAndConfirm(page)
  })

  test('can remove products with variants from cart', async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: 'Test Product With Variants',
      productSlug: 'test-product-variants',
      variant: 'Payload',
    })

    await removeFromCartAndConfirm(page)
  })

  test('should retain cart content on hard refresh', async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })

    await page.reload()

    const cartCount = page.locator('button[data-slot="sheet-trigger"] span').last()
    await cartCount.click()

    const productInCart = page.getByRole('dialog').getByText('Test Product')
    await expect(productInCart).toBeVisible()
  })

  test('can view and sort via search page', async ({ page }) => {
    await page.goto(`${baseURL}/search`)

    const productCard = page.locator(`a[href="/products/test-product"]`)
    await productCard.waitFor({ state: 'visible' })
    await expect(productCard).toBeVisible()

    const firstCard = page.locator('div.grid > a').first()
    const title = firstCard.locator('div.font-mono > div').first()
    await expect(title).not.toHaveText('Hoodie')

    const priceSort = page.getByText('Price: Low to high')
    await priceSort.click()
    await expect(page).toHaveURL(/\/search\?sort=priceInBDT/)

    await expect(title).toHaveText('Hoodie')
  })

  test('authenticated users can view account', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    await page.goto(`${baseURL}/account`)

    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Account settings')
  })

  test('authenticated users can update their name', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    await page.goto(`${baseURL}/account`)

    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Account settings')

    const nameInput = page.locator('input[name="name"]')
    const newName = `Test User`
    await nameInput.fill(newName)

    const updateButton = await page.getByRole('button', { name: 'Update Account' })
    await updateButton.click()

    const successMessage = page.locator('text=Successfully updated account')
    await expect(successMessage).toBeVisible()
  })

  test('authenticated users can view orders page', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    await page.goto(`${baseURL}/orders`)

    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Orders')
  })

  test('authenticated users can view order details', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })

    await checkout(page)

    await expectOrderIsDisplayed(page)
  })

  test('authenticated customers cannot access /admin', async ({ page }) => {
    await createUserAndLogin(page.request, userEmail, userPassword, false)
    await page.goto(`${baseURL}/admin`)
    const heading = page.locator('h1').first()
    await expect(heading).toContainText('Unauthorized')
  })

  test('Guest can create and view order', async ({ page }) => {
    await logoutAndExpectSuccess(page)
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })

    await checkout(page, guestCheckoutPhone)
    await expectOrderIsDisplayed(page)
  })

  test('Guest can view their order using /find-order', async ({ page }) => {
    await logoutAndExpectSuccess(page)
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })

    const guestEmail = guestCheckoutEmail

    await checkout(page, guestCheckoutPhone)

    const orderHeader = await page.locator('h1.text-sm.uppercase.font-mono > span').textContent()
    const orderNumber = orderHeader?.replace(/^Order #/, '').trim()

    await page.goto(`${baseURL}/find-order`)
    const orderNumberInput = page.locator('input[name="orderID"]')
    const emailInput = page.locator('input[name="email"]')
    await orderNumberInput.fill(orderNumber || '')
    await emailInput.fill(guestEmail)

    const findOrderButton = page.getByRole('button', { name: 'Find my order' })
    await findOrderButton.click()

    await expect(orderHeader).not.toBeNull()
  })

  test('Admins can update and view prices on products', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    await page.goto(`${baseURL}/admin/collections/products`)
    const testProductLink = page.getByRole('link', { name: 'Test Product', exact: true })
    await testProductLink.click()

    const productDetailsButton = page.getByRole('button', { name: 'Product Details' })
    await productDetailsButton.click()

    const priceInput = page.locator('input.formattedPriceInput[placeholder="0.00"]')
    await priceInput.fill('20.00')

    await saveAndConfirmSuccess(page)
  })

  test('Admins can update and view prices on variants', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    await page.goto(`${baseURL}/admin/collections/variants`)
    const testProductWithVariantsLink = page.getByRole('link', {
      name: 'Test Product With Variants — Payload',
      exact: true,
    })
    await testProductWithVariantsLink.click()

    const variantPriceInput = page.locator('input.formattedPriceInput[placeholder="0.00"]').first()
    await variantPriceInput.fill('25.00')

    await saveAndConfirmSuccess(page)
  })

  test('Admins can create new products with new variants', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    await page.goto(`${baseURL}/admin/collections/products/create`)
    const titleInput = page.locator('input#field-title')
    await titleInput.fill('New Product with Variants')
    const slugInput = page.locator('input#field-slug')
    await slugInput.fill('new-product-with-variants')
    const chooseFromExistingButton = page.getByRole('button', { name: 'Choose from existing' })
    await chooseFromExistingButton.click()
    const firstFileButton = page.locator('button.default-cell__first-cell').first()
    await firstFileButton.click()

    const productDetailsButton = page.getByRole('button', { name: 'Product Details' })
    await productDetailsButton.click()

    const enableVariantsCheckbox = page.locator('input#field-enableVariants')
    await enableVariantsCheckbox.check()

    // create a new variant type
    const addNewVariantTypeButton = page.locator(
      'button.relationship-add-new__add-button.doc-drawer__toggler[aria-label="Add new Variant Type"]',
    )
    await addNewVariantTypeButton.click()

    const variantTypeNameInput = page.locator('input#field-name')
    await variantTypeNameInput.fill('Pattern')
    const variantTypeLabelInput = page.locator('input#field-label')
    await variantTypeLabelInput.fill('Pattern')

    const saveButton = page.getByRole('button', { name: 'Save', exact: true })
    await saveButton.click()

    // create a new variant option
    const createVariantOptionButton = page.getByRole('button', {
      name: 'Create new Variant Option',
      exact: true,
    })
    await createVariantOptionButton.click()

    const variantOptionValueInput = page.locator('input#field-value')
    await variantOptionValueInput.fill('striped')
    const variantOptionLabelInput = page
      .getByRole('dialog', { name: /variantOptions/i })
      .locator('input#field-label')
    await variantOptionLabelInput.fill('Striped')
    await saveButton.nth(1).click()

    const closeButton = page.getByRole('button', { name: 'Close' }).nth(1)
    await closeButton.click()

    const publishChangesButton = page.getByRole('button', { name: 'Publish changes' })
    await publishChangesButton.click()

    await page.goto(`${baseURL}/shop`)
    const newProductCard = page.locator(`a[href="/products/new-product-with-variants"]`).first()
    await newProductCard.waitFor({ state: 'visible' })
    await expect(newProductCard).toBeVisible()
  })

  test('Admins can view transactions and orders', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })
    await checkout(page)
    await expectOrderIsDisplayed(page)
    const orderHeader = await page.locator('h1.text-sm.uppercase.font-mono > span').textContent()
    const orderNumber = orderHeader?.replace(/^Order #/, '').trim()

    await page.goto(`${baseURL}/admin/collections/orders`)
    const rowCount = await page.locator('div.table table tbody tr').count()
    expect(rowCount).toBeGreaterThan(1)

    await page.goto(`${baseURL}/admin/collections/orders/${orderNumber}`)
    const product = page.locator('div.rs__control', { hasText: 'Test Product' })
    await expect(product).toBeVisible()

    await page.goto(`${baseURL}/admin/collections/transactions`)
    const transactionRows = await page.locator('div.table table tbody tr').count()
    expect(transactionRows).toBeGreaterThan(0)

    const firstRow = page.locator('td.cell-createdAt > a').first()
    await firstRow.click()

    const status = page.locator('div.rs__control', { hasText: 'Succeeded' })
    await expect(status).toBeVisible()
  })

  test('should disable add to cart when product has no inventory', async ({ page }) => {
    await page.goto(`${baseURL}/products/no-inventory-product`)
    const addToCartButton = page.getByRole('button', { name: 'Add to Cart' })
    await expect(addToCartButton).toBeDisabled()
  })

  // Blocks checkout when stock is depleted after add-to-cart (shipping quote + order guard).
  test('should fail checkout when inventory is 0', async ({ page }) => {
    test.setTimeout(60_000)
    await loginFromUI(page, adminEmail, adminPassword)

    const productLookup = await page.request.get(
      `${baseURL}/api/products?where[slug][equals]=no-inventory-product&limit=1`,
    )
    const productBody = await productLookup.json()
    const productId = productBody.docs?.[0]?.id
    expect(productId).toBeTruthy()

    const stockUp = await page.request.patch(`${baseURL}/api/products/${productId}`, {
      data: { inventory: 1 },
    })
    expect(stockUp.ok()).toBeTruthy()

    await page.goto(`${baseURL}/products/no-inventory-product`)
    const addToCartButton = page.getByRole('button', { name: 'Add to Cart' })
    await expect(addToCartButton).toBeEnabled()
    await addToCartButton.click()

    const stockDown = await page.request.patch(`${baseURL}/api/products/${productId}`, {
      data: { inventory: 0 },
    })
    expect(stockDown.ok()).toBeTruthy()

    const quoteFailure = page.waitForResponse(
      (response) =>
        response.url().includes('/api/checkout/shipping-quote') && response.status() === 400,
    )

    await page.goto(`${baseURL}/checkout`)
    await expect(page.getByText('Dhaka')).toBeVisible({ timeout: 15_000 })
    await quoteFailure

    await expect(page.getByText('This product is out of stock')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Continue to review' })).toBeDisabled()
  })

  async function createUserAndLogin(
    request: any,
    email: string,
    password: string,
    isAdmin: boolean = true,
  ) {
    const data: any = {
      email,
      password,
    }

    if (isAdmin) {
      data.roles = ['admin']
    }

    const response = await request.post(`${baseURL}/api/users`, {
      data,
    })

    if (!response.ok() && response.status() !== 400) {
      throw new Error(`Failed to create user ${email}: ${response.status()}`)
    }

    const login = await request.post(`${baseURL}/api/users/login`, {
      data: {
        email,
        password,
      },
    })

    if (!login.ok()) {
      throw new Error(`Failed to login as ${email}`)
    }
  }

  async function productsAreSeeded(request: any): Promise<boolean> {
    const response = await request.get(
      `${baseURL}/api/products?where[slug][equals]=no-inventory-product&limit=1`,
    )
    const body = await response.json()
    return Boolean(body.docs?.length)
  }

  async function ensureAdminAddress(request: any) {
    const me = await request.get(`${baseURL}/api/users/me`)
    const meBody = await me.json()
    const userId = meBody.user?.id
    if (!userId) return

    const existing = await request.get(
      `${baseURL}/api/addresses?where[customer][equals]=${userId}&limit=1`,
    )
    const existingBody = await existing.json()
    if (existingBody.docs?.length) return

    await request.post(`${baseURL}/api/addresses`, {
      data: {
        customer: userId,
        district: 'Dhaka',
        fullAddress: '123 Test Street, Dhaka',
      },
    })
  }

  async function findOrCreateVariantType(
    request: any,
    name: string,
    label: string,
  ): Promise<number> {
    const lookup = await request.get(
      `${baseURL}/api/variantTypes?where[name][equals]=${encodeURIComponent(name)}&limit=1`,
    )
    const lookupBody = await lookup.json()
    if (lookupBody.docs?.[0]?.id) {
      return lookupBody.docs[0].id
    }

    const created = await request.post(`${baseURL}/api/variantTypes`, {
      data: { label, name },
    })
    const createdBody = await created.json()
    const id = createdBody.doc?.id
    if (!id) {
      throw new Error(`Failed to create variant type "${name}": ${JSON.stringify(createdBody)}`)
    }
    return id
  }

  async function findOrCreateVariantOption(
    request: any,
    variantTypeID: number,
    label: string,
    value: string,
  ): Promise<number> {
    const lookup = await request.get(
      `${baseURL}/api/variantOptions?where[variantType][equals]=${variantTypeID}&where[value][equals]=${encodeURIComponent(value)}&limit=1`,
    )
    const lookupBody = await lookup.json()
    if (lookupBody.docs?.[0]?.id) {
      return lookupBody.docs[0].id
    }

    const created = await request.post(`${baseURL}/api/variantOptions`, {
      data: { label, value, variantType: variantTypeID },
    })
    const createdBody = await created.json()
    const id = createdBody.doc?.id
    if (!id) {
      throw new Error(`Failed to create variant option "${value}": ${JSON.stringify(createdBody)}`)
    }
    return id
  }

  async function createVariantsAndProducts(page: Page) {
    const request = page.request
    await loginFromUI(page, adminEmail, adminPassword)

    const variantTypeID = await findOrCreateVariantType(request, 'brand', 'Brand')

    const payloadVariantID = await findOrCreateVariantOption(
      request,
      variantTypeID,
      'Payload',
      'payload',
    )
    const figmaVariantID = await findOrCreateVariantOption(
      request,
      variantTypeID,
      'Figma',
      'figma',
    )

    await page.goto(`${mediaURL}/create`)
    const fileInput = page.locator('input[type="file"]')
    const altInput = page.locator('input[name="alt"]')
    const filePath = path.resolve(dirname, '../../public/media/image-post1.webp')
    await fileInput.setInputFiles(filePath)
    await altInput.fill('Test Image')
    const uploadButton = page.locator('#action-save')
    await uploadButton.click()
    const successMessage = page.locator('text=Media successfully created')
    await expect(successMessage).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/collections\/media\/\d+/)
    const imageID = page.url().split('/').pop()

    const productWithVariants = await request.post(`${baseURL}/api/products`, {
      data: {
        title: 'Test Product With Variants',
        slug: 'test-product-variants',
        enableVariants: true,
        variantTypes: [variantTypeID],
        inventory: 100,
        _status: 'published',
        layout: [],
        gallery: [imageID],
        priceInBDTEnabled: true,
        priceInBDT: 1000,
      },
    })

    const productID = (await productWithVariants.json()).doc.id

    const variantPayload = await request.post(`${baseURL}/api/variants`, {
      data: {
        product: productID,
        variantType: variantTypeID,
        options: [payloadVariantID],
        priceInBDTEnabled: true,
        priceInBDT: 1000,
        inventory: 50,
        _status: 'published',
      },
    })

    const variantFigma = await request.post(`${baseURL}/api/variants`, {
      data: {
        product: productID,
        variantType: variantTypeID,
        options: [figmaVariantID],
        priceInBDTEnabled: true,
        priceInBDT: 1000,
        inventory: 50,
        _status: 'published',
      },
    })

    const product = await request.post(`${baseURL}/api/products`, {
      data: {
        title: 'Test Product',
        slug: 'test-product',
        inventory: 100,
        _status: 'published',
        layout: [],
        gallery: [imageID],
        priceInBDTEnabled: true,
        priceInBDT: 1000,
      },
    })

    const noInventoryProduct = await request.post(`${baseURL}/api/products`, {
      data: {
        title: 'No Inventory Product',
        slug: 'no-inventory-product',
        inventory: 0,
        _status: 'published',
        layout: [],
        gallery: [imageID],
        priceInBDTEnabled: true,
        priceInBDT: 1000,
      },
    })
  }

  async function logoutAndExpectSuccess(page: Page) {
    await page.goto(`${baseURL}/logout`)
    const heading = page.locator('h1').first()
    await expect(heading).toContainText(/logged out/i)
  }

  async function loginFromUI(page: Page, email: string, password: string) {
    await page.goto(`${baseURL}/login`)
    if (page.url().includes('/account')) {
      return
    }

    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await emailInput.waitFor({ state: 'visible' })
    await emailInput.fill(email)
    await passwordInput.fill(password)
    await submitButton.click()
    await page.waitForURL(/\/account/)
  }

  async function addToCartAndConfirm(
    page: Page,
    {
      productName,
      productSlug,
      variant,
    }: {
      productName: string
      productSlug: string
      variant?: string
    },
  ) {
    await page.goto(`${baseURL}/shop`)
    await expect(page).toHaveURL(/\/shop/)

    const productCard = page.locator(`a[href="/products/${productSlug}"]`).first()
    await productCard.waitFor({ state: 'visible' })
    await productCard.click()

    if (variant) {
      const variantButton = page.getByRole('button', { name: variant })
      await variantButton.waitFor({ state: 'visible' })
      await variantButton.click()
    }

    const addToCartButton = page.getByRole('button', { name: 'Add to Cart' })
    await expect(addToCartButton).toBeVisible()
    await addToCartButton.click()

    const cartCount = page.locator('button[data-slot="sheet-trigger"] span').last()
    await expect(cartCount).toHaveText('1')
    await cartCount.click()

    const productInCart = page.getByRole('dialog').getByText(productName, { exact: false })
    await expect(productInCart).toBeVisible()
  }

  async function removeFromCartAndConfirm(page: Page) {
    const reduceQuantityButton = page.getByRole('button', { name: 'Reduce item quantity' })
    await expect(reduceQuantityButton).toBeVisible()
    await reduceQuantityButton.click()

    const emptyCartMessage = page.getByText('Your cart is empty.')
    await expect(emptyCartMessage).toBeVisible()
  }

  async function checkout(page: Page, guestPhone?: string | null): Promise<void> {
    await page.goto(`${baseURL}/checkout`)

    if (guestPhone) {
      await page.locator('input[name="guestFullName"]').fill('Guest Customer')
      await page.locator('input[name="guestPhone"]').fill(guestPhone)
      await page.getByRole('button', { name: /continue as guest/i }).click()
    } else if (await page.getByRole('button', { name: 'Continue to delivery' }).isVisible()) {
      await page.getByRole('button', { name: 'Continue to delivery' }).click()
    }

    const addAddressButton = page.getByRole('button', { name: 'Add Address' })
    if (await addAddressButton.isVisible()) {
      await addAddressButton.click()
      await page.locator('#district').fill('Dhaka')
      await page.getByRole('option', { name: 'Dhaka', exact: true }).click()
      await page.locator('#fullAddress').fill('123 Test Street, Dhaka')
      await page.getByRole('button', { name: 'Save address' }).click()
    } else {
      const selectAddressButton = page.getByRole('button', { name: 'Select an address' })
      if (await selectAddressButton.isVisible()) {
        await selectAddressButton.click()
        await page.getByRole('button', { name: 'Select' }).first().click()
      }
    }

    const continueToReview = page.getByRole('button', { name: 'Continue to review' })
    await expect(continueToReview).toBeEnabled({ timeout: 30_000 })
    await continueToReview.click()

    const placeOrderButton = page.getByRole('button', { name: 'Place order' })
    await expect(placeOrderButton).toBeEnabled({ timeout: 15_000 })
    await placeOrderButton.click()

    await page.waitForURL(/\/orders/, { timeout: 30_000 })
    await expect(page).toHaveURL(/\/orders/)
  }

  async function expectOrderIsDisplayed(page: Page): Promise<void> {
    const orderHeader = await page.locator('h1.text-sm.uppercase.font-mono > span').textContent()
    expect(orderHeader).toContain('Order #')

    const orderNumber = orderHeader?.replace(/^Order #/, '').trim()
    const pageURL = page.url()

    expect(pageURL).toContain(`/orders/${orderNumber}`)
  }

  async function saveAndConfirmSuccess(page: Page) {
    const saveButton = page.locator('#action-save')
    await saveButton.click()

    const successMessage = page.locator('text=Updated successfully')
    await expect(successMessage).toBeVisible()
  }
})
