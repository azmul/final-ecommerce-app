# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend.e2e.spec.ts >> Frontend >> should fail checkout when inventory is 0
- Location: tests/e2e/frontend.e2e.spec.ts:356:3

# Error details

```
Error: Channel closed
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/products/no-inventory-product", waiting until "load"

```

```
Error: browserContext.close: Target page, context or browser has been closed
```