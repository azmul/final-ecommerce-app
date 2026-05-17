import React from 'react'

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[]
}

/** Renders Schema.org JSON-LD for types not covered by next-seo helpers. */
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data]

  return (
    <>
      {payload.map((item, index) => (
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
          key={index}
          type="application/ld+json"
        />
      ))}
    </>
  )
}
