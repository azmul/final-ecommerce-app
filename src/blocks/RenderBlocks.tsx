import { cmsBlockStackGapClassName } from '@/utilities/cmsLayout'
import React, { Suspense } from 'react'

import type { Page } from '../payload-types'

import { BlockRenderer } from './BlockRenderer'

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (!hasBlocks) return null

  return (
    <div className={cmsBlockStackGapClassName}>
      {blocks.map((block, index) => {
        if (!block?.blockType) return null

        const renderer = <BlockRenderer block={block} index={index} />

        // First block is likely above the fold — render without Suspense for faster LCP.
        if (index === 0) return renderer

        return (
          <Suspense fallback={null} key={index}>
            {renderer}
          </Suspense>
        )
      })}
    </div>
  )
}
