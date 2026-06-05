'use client'

import type { Media, Product } from '@/payload-types'
import React, { useEffect, useRef } from 'react'

type Props = { product: Product }

function resolveModelUrl(arModel: Product['arModel']): string | null {
  if (!arModel || typeof arModel !== 'object') return null
  const media = arModel as Media
  return typeof media.url === 'string' ? media.url : null
}

export function ProductArViewer({ product }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const modelUrl = resolveModelUrl(product.arModel)

  useEffect(() => {
    if (!modelUrl || !hostRef.current) return

    const scriptId = 'google-model-viewer-script'
    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (document.getElementById(scriptId)) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.id = scriptId
        script.type = 'module'
        script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
        script.onload = () => resolve()
        document.head.appendChild(script)
      })

    void ensureScript().then(() => {
      if (!hostRef.current) return
      hostRef.current.innerHTML = ''
      const viewer = document.createElement('model-viewer')
      viewer.setAttribute('src', modelUrl)
      viewer.setAttribute('alt', product.title ?? 'Product 3D model')
      viewer.setAttribute('ar', '')
      viewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
      viewer.setAttribute('camera-controls', '')
      viewer.setAttribute('auto-rotate', '')
      viewer.style.width = '100%'
      viewer.style.height = '360px'
      hostRef.current.appendChild(viewer)
    })
  }, [modelUrl, product.title])

  if (!modelUrl) return null

  return (
    <section className="rounded-2xl border border-border/70 bg-muted/10 p-4">
      <h2 className="mb-3 text-lg font-semibold">View in 3D</h2>
      <div ref={hostRef} />
    </section>
  )
}
