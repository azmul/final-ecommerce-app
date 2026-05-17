import { fetchSalesDashboardData } from '@/lib/admin/fetchSalesDashboardData'
import { requireStaffPermissionApi } from '@/lib/permissions/requireStaffPermissionApi'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireStaffPermissionApi('sales-dashboard', 'view', request.headers)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const payload = await getPayload({ config: configPromise })

  const url = new URL(request.url)
  const preset = url.searchParams.get('preset')
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  try {
    const data = await fetchSalesDashboardData({
      payload,
      endDate,
      preset,
      startDate,
    })
    return NextResponse.json(data)
  } catch (err) {
    payload.logger.error({ err, msg: 'sales-dashboard' })
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
