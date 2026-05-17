import type { SalesDashboardData, SalesKpi } from '@/lib/admin/salesDashboardTypes'
import { formatBdtAmount } from '@/lib/notifications/priceDropCopy'

const escapeHTML = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatPeriodLabel(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(iso),
    )
  return `${fmt(start)} – ${fmt(end)}`
}

function formatKpiDelta(kpi: SalesKpi): string {
  if (kpi.deltaPercent === null) return '—'
  const sign = kpi.deltaPercent > 0 ? '+' : ''
  return `${sign}${kpi.deltaPercent}% vs prior`
}

function renderDataTable(
  headers: string[],
  rows: (string | number)[][],
): string {
  if (rows.length === 0) return '<p class="empty">No data.</p>'

  return `
    <table>
      <thead>
        <tr>${headers.map((h) => `<th>${escapeHTML(h)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHTML(cell)}</td>`).join('')}</tr>`,
          )
          .join('')}
      </tbody>
    </table>
  `
}

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body {
    color: #111;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    line-height: 1.45;
    margin: 24px;
  }
  h1 { font-size: 22px; margin: 0 0 6px; }
  h2 {
    border-bottom: 1px solid #ddd;
    font-size: 14px;
    margin: 20px 0 8px;
    padding-bottom: 4px;
    page-break-after: avoid;
  }
  .meta { color: #555; margin: 0 0 16px; }
  .insights { margin: 0 0 16px; padding-left: 18px; }
  .insights li { margin-bottom: 4px; }
  .kpi-grid {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(3, 1fr);
    margin-bottom: 8px;
  }
  .kpi {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px 10px;
  }
  .kpi-label { color: #555; font-size: 10px; text-transform: uppercase; }
  .kpi-value { font-size: 16px; font-weight: 700; margin: 4px 0 2px; }
  .kpi-delta { color: #555; font-size: 10px; }
  table {
    border-collapse: collapse;
    margin-bottom: 8px;
    width: 100%;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  th { background: #f6f6f6; font-weight: 700; }
  .empty { color: #666; font-style: italic; }
  .two-col { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
  @page { margin: 16mm; }
  @media print {
    body { margin: 0; }
    h2 { page-break-after: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
`

export function createSalesDashboardPrintDocument(data: SalesDashboardData): string {
  const { health, kpis } = data
  const period = formatPeriodLabel(data.range.start, data.range.end)
  const generated = formatDateTime(new Date().toISOString())

  const kpiCards = [
    ['Revenue', formatBdtAmount(kpis.revenue.current), formatKpiDelta(kpis.revenue)],
    ['Orders', String(kpis.orders.current), formatKpiDelta(kpis.orders)],
    ['Avg. order value', formatBdtAmount(kpis.averageOrderValue.current), formatKpiDelta(kpis.averageOrderValue)],
    ['Promo discounts', formatBdtAmount(kpis.promoDiscountTotal.current), formatKpiDelta(kpis.promoDiscountTotal)],
    ['New customers', String(kpis.newCustomers.current), formatKpiDelta(kpis.newCustomers)],
    ['Pending reviews', String(data.pendingReviews), '—'],
  ]

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Sales dashboard — ${escapeHTML(period)}</title>
    <style>${PRINT_STYLES}</style>
  </head>
  <body>
    <h1>Sales dashboard</h1>
    <p class="meta">Period: ${escapeHTML(period)} · Generated ${escapeHTML(generated)}</p>

    ${
      data.insights.length > 0 ?
        `<h2>Insights</h2>
        <ul class="insights">
          ${data.insights.map((i) => `<li>${escapeHTML(i.message)}</li>`).join('')}
        </ul>`
      : ''
    }

    <h2>Health</h2>
    ${renderDataTable(
      ['Metric', 'Value', 'Detail'],
      [
        [
          'Cart conversion',
          health.cartConversionRate !== null ? `${health.cartConversionRate}%` : '—',
          `${data.carts.purchased} purchased / ${data.carts.abandoned} abandoned`,
        ],
        [
          'Cancel / refund rate',
          `${health.cancellationRate}%`,
          `${formatBdtAmount(health.revenueAtRisk)} at risk`,
        ],
        ['Promo usage', `${health.promoUsageRate}%`, 'Orders with promo code'],
        [
          'Repeat customer revenue',
          `${health.repeatCustomerShare}%`,
          `${health.repeatCustomers} of ${health.uniqueCustomers} buyers`,
        ],
      ],
    )}

    <h2>Overview</h2>
    <div class="kpi-grid">
      ${kpiCards
        .map(
          ([label, value, delta]) => `
        <div class="kpi">
          <div class="kpi-label">${escapeHTML(label)}</div>
          <div class="kpi-value">${escapeHTML(value)}</div>
          <div class="kpi-delta">${escapeHTML(delta)}</div>
        </div>`,
        )
        .join('')}
    </div>

    <h2>Revenue by day</h2>
    ${renderDataTable(
      ['Date', 'Orders', 'Revenue', 'AOV'],
      data.revenueByDay.map((d) => [
        d.date,
        d.orders,
        formatBdtAmount(d.revenue),
        formatBdtAmount(d.averageOrderValue),
      ]),
    )}

    <div class="two-col">
      <div>
        <h2>Orders by status</h2>
        ${renderDataTable(
          ['Status', 'Count'],
          data.ordersByStatus.map((r) => [r.status, r.count]),
        )}
      </div>
      <div>
        <h2>Revenue by day of week</h2>
        ${renderDataTable(
          ['Day', 'Orders', 'Revenue'],
          data.salesByDayOfWeek.map((d) => [d.label, d.orders, formatBdtAmount(d.revenue)]),
        )}
      </div>
    </div>

    <div class="two-col">
      <div>
        <h2>Top categories</h2>
        ${renderDataTable(
          ['Category', 'Share', 'Revenue'],
          data.topCategoriesByRevenue.map((r) => [r.title, `${r.sharePercent}%`, formatBdtAmount(r.revenue)]),
        )}
      </div>
      <div>
        <h2>Top brands</h2>
        ${renderDataTable(
          ['Brand', 'Share', 'Revenue'],
          data.topBrandsByRevenue.map((r) => [r.title, `${r.sharePercent}%`, formatBdtAmount(r.revenue)]),
        )}
      </div>
    </div>

    <div class="two-col">
      <div>
        <h2>Top customers</h2>
        ${renderDataTable(
          ['Customer', 'Orders', 'Revenue'],
          data.topCustomers.map((r) => [r.label, r.orders, formatBdtAmount(r.revenue)]),
        )}
      </div>
      <div>
        <h2>Orders by district</h2>
        ${renderDataTable(
          ['District', 'Orders', 'Share', 'Revenue'],
          data.ordersByDistrict.map((r) => [
            r.district,
            r.count,
            `${r.sharePercent}%`,
            formatBdtAmount(r.revenue),
          ]),
        )}
      </div>
    </div>

    <h2>Shipping &amp; delivery</h2>
    ${renderDataTable(
      ['Metric', 'Value'],
      [
        ['Shipping revenue', formatBdtAmount(data.shippingDelivery.summary.totalShippingRevenue)],
        ['Avg. shipping / order', formatBdtAmount(data.shippingDelivery.summary.avgShippingPerOrder)],
        ['Home delivery', `${data.shippingDelivery.summary.homeDeliveryShare}%`],
        ['Dhaka zone', `${data.shippingDelivery.summary.dhakaAreaShare}%`],
        ['Free delivery orders', data.shippingDelivery.summary.freeDeliveryOrders],
      ],
    )}
    <div class="two-col">
      <div>
        <h2>Delivery method</h2>
        ${renderDataTable(
          ['Method', 'Orders', 'Share'],
          data.shippingDelivery.byDeliveryType.map((r) => [r.label, r.count, `${r.sharePercent}%`]),
        )}
      </div>
      <div>
        <h2>Delivery zone</h2>
        ${renderDataTable(
          ['Zone', 'Orders', 'Share'],
          data.shippingDelivery.byDeliveryArea.map((r) => [r.label, r.count, `${r.sharePercent}%`]),
        )}
      </div>
    </div>
    <div class="two-col">
      <div>
        <h2>Shipment profiles</h2>
        ${renderDataTable(
          ['Profile', 'Orders', 'Share', 'Shipping'],
          data.shippingDelivery.byShipmentProfile.map((r) => [
            r.name,
            r.orders,
            `${r.sharePercent}%`,
            formatBdtAmount(r.shippingRevenue),
          ]),
        )}
      </div>
      <div>
        <h2>Fulfillment</h2>
        ${renderDataTable(
          ['Stage', 'Orders'],
          [
            ['Processing', data.shippingDelivery.fulfillment.processing],
            ['Shipped', data.shippingDelivery.fulfillment.shipped],
            ['Delivered', data.shippingDelivery.fulfillment.delivered],
            ['Completed', data.shippingDelivery.fulfillment.completed],
            ['With tracking', data.shippingDelivery.fulfillment.withTracking],
          ],
        )}
      </div>
    </div>

    <h2>Top products by revenue</h2>
    ${renderDataTable(
      ['Product', 'Qty', 'Revenue'],
      data.topProductsByRevenue.map((r) => [r.title, r.quantity, formatBdtAmount(r.revenue)]),
    )}

    <div class="two-col">
      <div>
        <h2>Payment methods</h2>
        ${renderDataTable(
          ['Method', 'Transactions', 'Volume'],
          data.paymentMethods.map((r) => [r.method, r.count, formatBdtAmount(r.revenue)]),
        )}
      </div>
      <div>
        <h2>Carts (period)</h2>
        ${renderDataTable(
          ['Metric', 'Count'],
          [
            ['Active (with items)', data.carts.active],
            ['Converted', data.carts.purchased],
            ['Abandoned', data.carts.abandoned],
          ],
        )}
      </div>
    </div>

    <h2>Recent orders</h2>
    ${renderDataTable(
      ['Order', 'Customer', 'Status', 'Total', 'Date'],
      data.recentOrders.map((o) => [
        `#${o.id}`,
        o.customerLabel,
        o.status ?? '—',
        formatBdtAmount(o.amount),
        formatDateTime(o.createdAt),
      ]),
    )}
  </body>
</html>`
}

export function exportSalesDashboardPdf(data: SalesDashboardData): void {
  const printWindow = window.open('', '_blank', 'width=960,height=800')

  if (!printWindow) {
    window.alert('Pop-up blocked. Allow pop-ups for this site to save the dashboard as PDF.')
    return
  }

  printWindow.document.open()
  printWindow.document.write(createSalesDashboardPrintDocument(data))
  printWindow.document.close()
  printWindow.focus()

  const triggerPrint = () => {
    printWindow.print()
  }

  if (printWindow.document.readyState === 'complete') {
    triggerPrint()
  } else {
    printWindow.addEventListener('load', triggerPrint, { once: true })
  }
}
