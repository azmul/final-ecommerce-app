import React from 'react'

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Escapes characters that could break out of a `<script>` block or corrupt the
 * JSON payload. `JSON.stringify` alone does NOT escape `<`, so a value such as a
 * product review containing `</script><script>…` would terminate the JSON-LD
 * block and inject live script. Also neutralizes the JS line separators
 * U+2028/U+2029, which are valid in JSON strings but not in inline scripts.
 */
function serializeJsonLd(item: Record<string, unknown>): string {
  return JSON.stringify(item)
    .split('<')
    .join('\\u003c')
    .split(String.fromCharCode(0x2028))
    .join('\\u2028')
    .split(String.fromCharCode(0x2029))
    .join('\\u2029')
}

/** Renders Schema.org JSON-LD for types not covered by next-seo helpers. */
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data]

  return (
    <>
      {payload.map((item, index) => (
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
          key={index}
          type="application/ld+json"
        />
      ))}
    </>
  )
}
