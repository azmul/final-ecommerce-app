import { fetchSalesDashboardData } from '@/lib/admin/fetchSalesDashboardData'
import { checkRole } from '@/access/utilities'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user || !checkRole(['admin'], user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
