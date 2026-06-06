import { redirect } from 'next/navigation'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AddressesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const query = new URLSearchParams({ tab: 'addresses' })

  for (const [key, value] of Object.entries(params)) {
    if (key === 'tab' || value == null) continue
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry))
    } else {
      query.set(key, value)
    }
  }

  redirect(`/account?${query.toString()}`)
}
