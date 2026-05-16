import { RequiredDataFromCollectionSlug } from 'payload'

export const homeStaticData: () => RequiredDataFromCollectionSlug<'pages'> = () => {
  return {
    slug: 'home',
    _status: 'published',
    layout: [],
    meta: {
      description: 'An open-source ecommerce site built with Payload and Next.js.',
      title: 'Store',
    },
    title: 'Home',
  }
}
