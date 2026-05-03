'use client'

import { Button, useDocumentInfo } from '@payloadcms/ui'

type PrintableValue = Record<string, unknown> | string | number | null | undefined

type OrderItem = {
  product?: PrintableValue
  quantity?: number | null
  variant?: PrintableValue
}

const escapeHTML = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatDateTime = (value: unknown): string => {
  if (!value || typeof value !== 'string') {
    return 'N/A'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    second: '2-digit',
    timeZoneName: 'short',
    year: 'numeric',
  }).format(date)
}

const formatCurrency = (amount: unknown, currency: unknown): string => {
  if (typeof amount !== 'number') {
    return 'N/A'
  }

  const currencyCode = typeof currency === 'string' ? currency : 'BDT'

  return new Intl.NumberFormat(undefined, {
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
    style: 'currency',
  }).format(amount / 100)
}

const getRelationLabel = (value: PrintableValue): string => {
  if (!value) {
    return 'N/A'
  }

  if (typeof value !== 'object') {
    return String(value)
  }

  const label =
    value.title ??
    value.name ??
    value.email ??
    value.sku ??
    value.slug ??
    value.id ??
    value.value ??
    'N/A'

  return String(label)
}

const renderRows = (rows: [string, unknown][]): string =>
  rows
    .map(
      ([label, value]) => `
        <tr>
          <th>${escapeHTML(label)}</th>
          <td>${escapeHTML(value)}</td>
        </tr>
      `,
    )
    .join('')

const renderAddress = (address: PrintableValue): string => {
  if (!address || typeof address !== 'object') {
    return '<p>N/A</p>'
  }

  const lines = [address.district, address.fullAddress].filter(Boolean)

  if (lines.length === 0) {
    return '<p>N/A</p>'
  }

  return `<address>${lines.map((line) => escapeHTML(line)).join('<br />')}</address>`
}

const renderItems = (items: unknown): string => {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p>No items.</p>'
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Variant</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map((item: OrderItem) => {
            return `
              <tr>
                <td>${escapeHTML(getRelationLabel(item?.product))}</td>
                <td>${escapeHTML(getRelationLabel(item?.variant))}</td>
                <td>${escapeHTML(item?.quantity ?? 'N/A')}</td>
              </tr>
            `
          })
          .join('')}
      </tbody>
    </table>
  `
}

const createPrintDocument = (order: Record<string, unknown>): string => {
  const orderID = order.id ?? 'N/A'

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Order ${escapeHTML(orderID)}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            color: #111;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            margin: 32px;
          }

          h1 {
            font-size: 28px;
            margin: 0 0 8px;
          }

          h2 {
            border-bottom: 1px solid #ddd;
            font-size: 18px;
            margin: 28px 0 12px;
            padding-bottom: 6px;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          th,
          td {
            border: 1px solid #ddd;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #f6f6f6;
            font-weight: 700;
            width: 180px;
          }

          address {
            font-style: normal;
          }

          .meta {
            color: #555;
            margin: 0 0 24px;
          }

          @page {
            margin: 20mm;
          }
        </style>
      </head>
      <body>
        <h1>Order #${escapeHTML(orderID)}</h1>
        <p class="meta">Generated ${escapeHTML(formatDateTime(new Date().toISOString()))}</p>

        <h2>Order Summary</h2>
        <table>
          <tbody>
            ${renderRows([
              ['Order ID', orderID],
              ['Status', order.status ?? 'N/A'],
              ['Order Date', formatDateTime(order.createdAt)],
              ['Last Updated', formatDateTime(order.updatedAt)],
              ['Customer', getRelationLabel(order.customer as PrintableValue)],
              ['Customer Full Name', order.customerFullName ?? 'N/A'],
              ['Customer Phone', order.customerPhone ?? 'N/A'],
              ['Customer Email', order.customerEmail ?? 'N/A'],
              ['Total', formatCurrency(order.amount, order.currency)],
              ['Currency', order.currency ?? 'N/A'],
            ])}
          </tbody>
        </table>

        <h2>Items</h2>
        ${renderItems(order.items)}

        <h2>Shipping Address</h2>
        ${renderAddress(order.shippingAddress as PrintableValue)}
      </body>
    </html>
  `
}

export const PrintOrderButton = () => {
  const { data } = useDocumentInfo()

  const handlePrint = async () => {
    if (!data) {
      return
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700')

    if (!printWindow) {
      window.print()
      return
    }

    printWindow.document.open()
    printWindow.document.write(
      '<p style="font-family: Arial, sans-serif;">Preparing order PDF...</p>',
    )
    printWindow.document.close()

    let order = data

    if (data.id) {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(String(data.id))}?depth=2`, {
          credentials: 'same-origin',
        })

        if (response.ok) {
          order = await response.json()
        }
      } catch (error) {
        console.error('Unable to load populated order for printing.', error)
      }
    }

    printWindow.document.open()
    printWindow.document.write(createPrintDocument(order))
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <Button buttonStyle="secondary" onClick={handlePrint} size="medium" type="button">
      Print / Save PDF
    </Button>
  )
}
