# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend.e2e.spec.ts >> Frontend >> should fail checkout when inventory is 0
- Location: tests/e2e/frontend.e2e.spec.ts:356:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Dhaka')
Expected: visible
Error: strict mode violation: getByText('Dhaka') resolved to 3 elements:
    1) <p class="font-medium">Dhaka</p> aka getByText('Dhaka', { exact: true })
    2) <p class="whitespace-pre-wrap text-muted-foreground">123 Test Street, Dhaka</p> aka getByText('Test Street, Dhaka')
    3) <p class="mt-1 text-xs text-muted-foreground">Choose handover style. Zones use your address dis…</p> aka getByText('Choose handover style. Zones')

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('Dhaka')

```

```
Error: page.waitForResponse: Test ended.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - link "Dashboard" [ref=e6] [cursor=pointer]:
      - /url: http://localhost:3000/admin
      - generic [ref=e7]: Dashboard
    - link "admin@test.com" [ref=e8] [cursor=pointer]:
      - /url: http://localhost:3000/admin/collections/users/3
    - link "Logout" [ref=e9] [cursor=pointer]:
      - /url: http://localhost:3000/admin/logout
  - button "Open cart, 1 items" [ref=e10] [cursor=pointer]:
    - generic [ref=e11]:
      - img [ref=e12]
      - generic [ref=e15]: 1 Item
    - generic [ref=e17]: ৳10.00
  - button "Open shopping assistant" [ref=e18]:
    - generic [ref=e21]:
      - img [ref=e22]
      - img [ref=e24]
  - banner [ref=e27]:
    - navigation "Main navigation" [ref=e28]:
      - generic [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]:
            - button "Open menu" [ref=e33]:
              - img [ref=e34]
            - link "Store" [ref=e36] [cursor=pointer]:
              - /url: /
              - img [ref=e37]
              - generic [ref=e40]: Store
          - generic [ref=e41]:
            - link "Wishlist" [ref=e42] [cursor=pointer]:
              - /url: /wishlist
              - img [ref=e43]
            - button "Open cart, 1 item" [ref=e45]:
              - img
              - generic [ref=e46]: "1"
        - search "Search products" [ref=e49]:
          - generic [ref=e50]: Search products
          - combobox "Search products" [ref=e51]
          - generic:
            - img
  - main [ref=e52]:
    - generic [ref=e54]:
      - generic [ref=e55]:
        - navigation "Breadcrumb" [ref=e56]:
          - link "Home" [ref=e57] [cursor=pointer]:
            - /url: /
          - img [ref=e58]
          - generic [ref=e60]: Checkout
        - generic [ref=e61]:
          - generic [ref=e62]:
            - heading "Checkout" [level=1] [ref=e63]
            - paragraph [ref=e64]: Review your details and place your order. Your information is handled securely for this purchase only.
          - generic [ref=e65]:
            - img [ref=e66]
            - generic [ref=e69]: Secure checkout
      - generic [ref=e70]:
        - generic [ref=e71]:
          - generic [ref=e72]:
            - generic [ref=e73]:
              - generic [ref=e74]: "1"
              - generic [ref=e75]:
                - img [ref=e77]
                - generic [ref=e80]:
                  - generic [ref=e81]: Contact
                  - generic [ref=e82]: Save time next time—sign in, or finish as a guest.
            - generic [ref=e84]:
              - paragraph [ref=e85]: admin@test.com
              - paragraph [ref=e86]:
                - text: Not you?
                - link "Log out" [ref=e87] [cursor=pointer]:
                  - /url: /logout
          - generic [ref=e88]:
            - generic [ref=e89]:
              - generic [ref=e90]: "2"
              - generic [ref=e91]:
                - img [ref=e93]
                - generic [ref=e96]:
                  - generic [ref=e97]: Delivery address
                  - generic [ref=e98]: We use this to prepare delivery and invoicing.
            - generic [ref=e99]:
              - generic [ref=e100]:
                - generic [ref=e101]:
                  - paragraph [ref=e102]: Dhaka
                  - paragraph [ref=e103]: 123 Test Street, Dhaka
                - button "Change" [ref=e105]
              - generic [ref=e106]:
                - checkbox "Shipping same as billing" [checked] [ref=e107]:
                  - generic:
                    - img
                - generic [ref=e108]:
                  - generic [ref=e109] [cursor=pointer]:
                    - img [ref=e110]
                    - text: Shipping same as billing
                  - generic [ref=e115]: Uncheck if your package should go somewhere else.
              - generic [ref=e116]:
                - generic [ref=e117]:
                  - heading "Delivery method" [level=3] [ref=e118]
                  - paragraph [ref=e119]: Choose handover style. Zones use your address district (Dhaka metro vs elsewhere).
                - radiogroup [ref=e120]:
                  - generic [ref=e121] [cursor=pointer]:
                    - radio "Point delivery Collect from a courier point or locker." [disabled] [ref=e122]
                    - generic [ref=e123]:
                      - generic [ref=e124]: Point delivery
                      - generic [ref=e125]: Collect from a courier point or locker.
                  - generic [ref=e126] [cursor=pointer]:
                    - radio "Home delivery Doorstep delivery." [checked] [disabled] [ref=e127]
                    - generic [ref=e128]:
                      - generic [ref=e129]: Home delivery
                      - generic [ref=e130]: Doorstep delivery.
                - generic [ref=e131]:
                  - img [ref=e132]
                  - text: Updating shipping estimate…
          - generic [ref=e134]:
            - generic [ref=e136]:
              - generic [ref=e137]: "3"
              - generic [ref=e138]:
                - generic [ref=e139]: Review & place order
                - generic [ref=e140]: Pay on delivery—we will confirm your order right away.
            - generic [ref=e141]:
              - button "Place order" [disabled]
        - complementary [ref=e142]:
          - generic [ref=e143]:
            - generic [ref=e145]:
              - img [ref=e147]
              - generic [ref=e150]:
                - generic [ref=e151]: Order summary
                - generic [ref=e152]: Items and total for this checkout.
            - generic [ref=e153]:
              - generic [ref=e155]:
                - generic [ref=e156]:
                  - generic [ref=e157]: Promo code / coupon
                  - textbox "Promo code / coupon" [ref=e158]:
                    - /placeholder: Enter code
                - button "Apply" [disabled]
              - generic [ref=e159]:
                - generic [ref=e160]:
                  - img [ref=e161]
                  - text: Gift card
                - generic [ref=e165]:
                  - generic [ref=e166]:
                    - generic [ref=e167]: Code
                    - textbox "Code" [ref=e168]:
                      - /placeholder: GIFT-XXXX
                  - button "Apply" [disabled]
              - list [ref=e169]:
                - listitem [ref=e170]:
                  - generic [ref=e172]:
                    - paragraph [ref=e173]: No Inventory Product
                    - generic [ref=e174]:
                      - generic [ref=e175]: ×1
                      - paragraph [ref=e176]: ৳10.00
              - generic [ref=e177]:
                - generic [ref=e179]:
                  - generic [ref=e180]: Total
                  - paragraph [ref=e181]: ৳10.00
                - paragraph [ref=e182]: Select address and delivery method to include shipping in the total.
  - contentinfo [ref=e183]:
    - generic [ref=e185]:
      - generic [ref=e186]:
        - link "Payload logo Store" [ref=e187] [cursor=pointer]:
          - /url: /
          - img "Payload logo" [ref=e188]
          - generic [ref=e191]: Store
        - navigation "Browse store" [ref=e192]:
          - generic [ref=e193]: Explore
          - list [ref=e194]:
            - listitem [ref=e195]:
              - link "Shop" [ref=e196] [cursor=pointer]:
                - /url: /shop
            - listitem [ref=e197]:
              - link "Blog" [ref=e198] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e199]:
              - link "Brands" [ref=e200] [cursor=pointer]:
                - /url: /all-brands
      - combobox [ref=e202]:
        - generic: Light
        - img
    - generic [ref=e204]:
      - paragraph [ref=e205]: © 2023-2026 Payload Inc. All rights reserved.
      - separator [ref=e206]
      - paragraph [ref=e207]: Designed in Michigan
      - paragraph [ref=e208]:
        - link "Crafted by Payload" [ref=e209] [cursor=pointer]:
          - /url: https://payloadcms.com
  - button "Open Next.js Dev Tools" [ref=e215] [cursor=pointer]:
    - generic [ref=e218]:
      - text: Compiling
      - generic [ref=e219]:
        - generic [ref=e220]: .
        - generic [ref=e221]: .
        - generic [ref=e222]: .
  - alert [ref=e223]
```

# Test source

```ts
  282 |     await addNewVariantTypeButton.click()
  283 | 
  284 |     const variantTypeNameInput = page.locator('input#field-name')
  285 |     await variantTypeNameInput.fill('Pattern')
  286 |     const variantTypeLabelInput = page.locator('input#field-label')
  287 |     await variantTypeLabelInput.fill('Pattern')
  288 | 
  289 |     const saveButton = page.getByRole('button', { name: 'Save', exact: true })
  290 |     await saveButton.click()
  291 | 
  292 |     // create a new variant option
  293 |     const createVariantOptionButton = page.getByRole('button', {
  294 |       name: 'Create new Variant Option',
  295 |       exact: true,
  296 |     })
  297 |     await createVariantOptionButton.click()
  298 | 
  299 |     const variantOptionValueInput = page.locator('input#field-value')
  300 |     await variantOptionValueInput.fill('striped')
  301 |     const variantOptionLabelInput = page
  302 |       .getByRole('dialog', { name: /variantOptions/i })
  303 |       .locator('input#field-label')
  304 |     await variantOptionLabelInput.fill('Striped')
  305 |     await saveButton.nth(1).click()
  306 | 
  307 |     const closeButton = page.getByRole('button', { name: 'Close' }).nth(1)
  308 |     await closeButton.click()
  309 | 
  310 |     const publishChangesButton = page.getByRole('button', { name: 'Publish changes' })
  311 |     await publishChangesButton.click()
  312 | 
  313 |     await page.goto(`${baseURL}/shop`)
  314 |     const newProductCard = page.locator(`a[href="/products/new-product-with-variants"]`).first()
  315 |     await newProductCard.waitFor({ state: 'visible' })
  316 |     await expect(newProductCard).toBeVisible()
  317 |   })
  318 | 
  319 |   test('Admins can view transactions and orders', async ({ page }) => {
  320 |     await loginFromUI(page, adminEmail, adminPassword)
  321 |     await addToCartAndConfirm(page, {
  322 |       productName: 'Test Product',
  323 |       productSlug: 'test-product',
  324 |     })
  325 |     await checkout(page, testPaymentDetails)
  326 |     await expectOrderIsDisplayed(page)
  327 |     const orderHeader = await page.locator('h1.text-sm.uppercase.font-mono > span').textContent()
  328 |     const orderNumber = orderHeader?.replace(/^Order #/, '').trim()
  329 | 
  330 |     await page.goto(`${baseURL}/admin/collections/orders`)
  331 |     const rowCount = await page.locator('div.table table tbody tr').count()
  332 |     expect(rowCount).toBeGreaterThan(1)
  333 | 
  334 |     await page.goto(`${baseURL}/admin/collections/orders/${orderNumber}`)
  335 |     const product = page.locator('div.rs__control', { hasText: 'Test Product' })
  336 |     await expect(product).toBeVisible()
  337 | 
  338 |     await page.goto(`${baseURL}/admin/collections/transactions`)
  339 |     const transactionRows = await page.locator('div.table table tbody tr').count()
  340 |     expect(transactionRows).toBeGreaterThan(0)
  341 | 
  342 |     const firstRow = page.locator('td.cell-createdAt > a').first()
  343 |     await firstRow.click()
  344 | 
  345 |     const status = page.locator('div.rs__control', { hasText: 'Succeeded' })
  346 |     await expect(status).toBeVisible()
  347 |   })
  348 | 
  349 |   test('should disable add to cart when product has no inventory', async ({ page }) => {
  350 |     await page.goto(`${baseURL}/products/no-inventory-product`)
  351 |     const addToCartButton = page.getByRole('button', { name: 'Add to Cart' })
  352 |     await expect(addToCartButton).toBeDisabled()
  353 |   })
  354 | 
  355 |   // Blocks checkout when stock is depleted after add-to-cart (shipping quote + order guard).
  356 |   test('should fail checkout when inventory is 0', async ({ page }) => {
  357 |     test.setTimeout(60_000)
  358 |     await loginFromUI(page, adminEmail, adminPassword)
  359 | 
  360 |     const productLookup = await page.request.get(
  361 |       `${baseURL}/api/products?where[slug][equals]=no-inventory-product&limit=1`,
  362 |     )
  363 |     const productBody = await productLookup.json()
  364 |     const productId = productBody.docs?.[0]?.id
  365 |     expect(productId).toBeTruthy()
  366 | 
  367 |     const stockUp = await page.request.patch(`${baseURL}/api/products/${productId}`, {
  368 |       data: { inventory: 1 },
  369 |     })
  370 |     expect(stockUp.ok()).toBeTruthy()
  371 | 
  372 |     await page.goto(`${baseURL}/products/no-inventory-product`)
  373 |     const addToCartButton = page.getByRole('button', { name: 'Add to Cart' })
  374 |     await expect(addToCartButton).toBeEnabled()
  375 |     await addToCartButton.click()
  376 | 
  377 |     const stockDown = await page.request.patch(`${baseURL}/api/products/${productId}`, {
  378 |       data: { inventory: 0 },
  379 |     })
  380 |     expect(stockDown.ok()).toBeTruthy()
  381 | 
> 382 |     const quoteFailure = page.waitForResponse(
      |                               ^ Error: page.waitForResponse: Test ended.
  383 |       (response) =>
  384 |         response.url().includes('/api/checkout/shipping-quote') && response.status() === 400,
  385 |     )
  386 | 
  387 |     await page.goto(`${baseURL}/checkout`)
  388 |     await expect(page.getByText('Dhaka')).toBeVisible({ timeout: 15_000 })
  389 |     await quoteFailure
  390 | 
  391 |     await expect(page.getByText('This product is out of stock')).toBeVisible({ timeout: 15_000 })
  392 |     await expect(page.getByRole('button', { name: 'Place order' })).toBeDisabled()
  393 |   })
  394 | 
  395 |   async function createUserAndLogin(
  396 |     request: any,
  397 |     email: string,
  398 |     password: string,
  399 |     isAdmin: boolean = true,
  400 |   ) {
  401 |     const data: any = {
  402 |       email,
  403 |       password,
  404 |     }
  405 | 
  406 |     if (isAdmin) {
  407 |       data.roles = ['admin']
  408 |     }
  409 | 
  410 |     const response = await request.post(`${baseURL}/api/users`, {
  411 |       data,
  412 |     })
  413 | 
  414 |     if (!response.ok() && response.status() !== 400) {
  415 |       throw new Error(`Failed to create user ${email}: ${response.status()}`)
  416 |     }
  417 | 
  418 |     const login = await request.post(`${baseURL}/api/users/login`, {
  419 |       data: {
  420 |         email,
  421 |         password,
  422 |       },
  423 |     })
  424 | 
  425 |     if (!login.ok()) {
  426 |       throw new Error(`Failed to login as ${email}`)
  427 |     }
  428 |   }
  429 | 
  430 |   async function productsAreSeeded(request: any): Promise<boolean> {
  431 |     const response = await request.get(
  432 |       `${baseURL}/api/products?where[slug][equals]=no-inventory-product&limit=1`,
  433 |     )
  434 |     const body = await response.json()
  435 |     return Boolean(body.docs?.length)
  436 |   }
  437 | 
  438 |   async function ensureAdminAddress(request: any) {
  439 |     const me = await request.get(`${baseURL}/api/users/me`)
  440 |     const meBody = await me.json()
  441 |     const userId = meBody.user?.id
  442 |     if (!userId) return
  443 | 
  444 |     const existing = await request.get(
  445 |       `${baseURL}/api/addresses?where[customer][equals]=${userId}&limit=1`,
  446 |     )
  447 |     const existingBody = await existing.json()
  448 |     if (existingBody.docs?.length) return
  449 | 
  450 |     await request.post(`${baseURL}/api/addresses`, {
  451 |       data: {
  452 |         customer: userId,
  453 |         district: 'Dhaka',
  454 |         fullAddress: '123 Test Street, Dhaka',
  455 |       },
  456 |     })
  457 |   }
  458 | 
  459 |   async function findOrCreateVariantType(
  460 |     request: any,
  461 |     name: string,
  462 |     label: string,
  463 |   ): Promise<number> {
  464 |     const lookup = await request.get(
  465 |       `${baseURL}/api/variantTypes?where[name][equals]=${encodeURIComponent(name)}&limit=1`,
  466 |     )
  467 |     const lookupBody = await lookup.json()
  468 |     if (lookupBody.docs?.[0]?.id) {
  469 |       return lookupBody.docs[0].id
  470 |     }
  471 | 
  472 |     const created = await request.post(`${baseURL}/api/variantTypes`, {
  473 |       data: { label, name },
  474 |     })
  475 |     const createdBody = await created.json()
  476 |     const id = createdBody.doc?.id
  477 |     if (!id) {
  478 |       throw new Error(`Failed to create variant type "${name}": ${JSON.stringify(createdBody)}`)
  479 |     }
  480 |     return id
  481 |   }
  482 | 
```