import type { Category, Product, VariantOption, VariantType } from '@/payload-types'
import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

type ProductArgs = {
  galleryImage: Media
  metaImage: Media
  variantTypes: VariantType[]
  categories: Category[]
  relatedProducts: Product[]
}

export const productHatData: (args: ProductArgs) => RequiredDataFromCollectionSlug<'products'> = ({
  galleryImage,
  relatedProducts,
  metaImage,
  variantTypes,
  categories,
}) => {
  return {
    meta: {
      title: 'Hat | Store',
      image: metaImage,
      description:
        'Top off your look with our classic hat, crafted for style and comfort. Made with breathable, high-quality materials and an adjustable strap for the perfect fit.',
    },
    _status: 'published',
    layout: [],
    categories: categories,
    description: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Top off your look with our classic hat, crafted for style and comfort. Made with breathable, high-quality materials and an adjustable strap for the perfect fit, it’s ideal for everyday wear or outdoor adventures. Available in a range of colors to match any outfit.',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: 0,
            textStyle: '',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    },
    gallery: [{ image: galleryImage }],
    technicalSpecs: [
      { label: 'Material', value: 'Cotton blend' },
      { label: 'Care', value: 'Spot clean / hand wash' },
      { label: 'Sizes', value: 'One size (adjustable strap)' },
    ],
    title: 'Hat',
    slug: 'hat',
    priceInBDTEnabled: true,
    priceInBDT: 2500,
    relatedProducts: relatedProducts,
  }
}
