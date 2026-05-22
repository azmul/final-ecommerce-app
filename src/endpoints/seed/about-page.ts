import { RequiredDataFromCollectionSlug } from 'payload'

export const aboutPageData = (): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: 'about',
    _status: 'published',
    title: 'About Us',
    meta: {
      title: 'About Us',
      description:
        'Learn about our story, values, and commitment to quality products and customer service.',
    },
    layout: [
      {
        blockName: 'Our story',
        blockType: 'content',
        columns: [
          {
            size: 'full',
            enableLink: false,
            richText: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'heading',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Our story',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    tag: 'h2',
                    version: 1,
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'We started with a simple goal: make quality products easy to discover and buy online. Today we serve customers across Bangladesh with curated collections, transparent pricing, and reliable delivery.',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Every product in our catalog is selected for durability, value, and customer satisfaction. Our team works directly with trusted brands and suppliers so you can shop with confidence.',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
          },
        ],
      },
      {
        blockName: 'Our values',
        blockType: 'marketingFeatures',
        heading: 'What we stand for',
        subheading: 'The principles that guide how we source, sell, and support every order.',
        columns: '3',
        items: [
          {
            icon: 'star',
            title: 'Quality first',
            description:
              'We partner with reputable brands and inspect listings so you receive products that match their descriptions.',
          },
          {
            icon: 'truck',
            title: 'Reliable delivery',
            description:
              'Orders are packed carefully and shipped with tracking updates so you always know where your package is.',
          },
          {
            icon: 'headphones',
            title: 'Customer support',
            description:
              'Our support team is here to help with orders, returns, and product questions—before and after purchase.',
          },
        ],
      },
      {
        blockName: 'Trust stats',
        blockType: 'trustStats',
        variant: 'gradient',
        items: [
          { value: '10K+', label: 'Happy customers' },
          { value: '500+', label: 'Products listed' },
          { value: '48h', label: 'Average dispatch' },
          { value: '4.8★', label: 'Average rating' },
        ],
      },
      {
        blockName: 'Shop CTA',
        blockType: 'cta',
        links: [
          {
            link: {
              type: 'custom',
              appearance: 'default',
              label: 'Browse the shop',
              url: '/shop',
            },
          },
          {
            link: {
              type: 'custom',
              appearance: 'outline',
              label: 'Contact us',
              url: '/contact',
            },
          },
        ],
        richText: {
          root: {
            type: 'root',
            children: [
              {
                type: 'heading',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Ready to shop?',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                tag: 'h3',
                version: 1,
              },
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Explore our latest collections or get in touch if you have questions.',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                textFormat: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
      },
    ],
  }
}
