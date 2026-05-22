import { RequiredDataFromCollectionSlug } from 'payload'

export const faqPageData = (): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: 'faq',
    _status: 'published',
    title: 'FAQ',
    meta: {
      title: 'Frequently Asked Questions',
      description:
        'Answers to common questions about orders, shipping, returns, payments, and account support.',
    },
    layout: [
      {
        blockName: 'FAQ',
        blockType: 'faq',
        heading: 'Frequently asked questions',
        subheading: 'Quick answers about shopping, delivery, and support.',
        items: [
          {
            question: 'How long does delivery take?',
            answer:
              'Most orders are dispatched within 1–2 business days. Delivery typically takes 2–5 business days depending on your location in Bangladesh. You will receive tracking details by email or SMS once your order ships.',
          },
          {
            question: 'What payment methods do you accept?',
            answer:
              'We accept major cards and other payment methods shown at checkout. All transactions are processed securely. If a payment fails, try again or contact support with your order reference.',
          },
          {
            question: 'Can I return or exchange an item?',
            answer:
              'Yes. Unused items in original packaging may be returned within the return window stated on your order confirmation. Contact support to start a return or exchange—we will guide you through the process.',
          },
          {
            question: 'How do I track my order?',
            answer:
              'Sign in to your account and open your order history, or use the “Find my order” link in the footer with your order number and email. Tracking updates appear as soon as the carrier scans your package.',
          },
          {
            question: 'Do you ship outside Bangladesh?',
            answer:
              'Currently we ship within Bangladesh only. If international shipping becomes available, we will announce it on the site and update this page.',
          },
          {
            question: 'How can I contact customer support?',
            answer:
              'Use the contact form on our website or reply to your order confirmation email. Include your order number so we can help you faster. Support hours are listed on the contact page.',
          },
        ],
      },
      {
        blockName: 'Contact CTA',
        blockType: 'cta',
        links: [
          {
            link: {
              type: 'custom',
              appearance: 'default',
              label: 'Contact support',
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
                    text: 'Still have questions?',
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
                    text: 'Our team is happy to help with orders, products, and account issues.',
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
