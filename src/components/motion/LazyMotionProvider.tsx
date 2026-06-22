'use client'

import { LazyMotion } from 'framer-motion'
import React from 'react'

// Code-split Framer Motion's feature bundle. Components must use `m.*`
// (never `motion.*`) so only the tiny `m` runtime ships eagerly; `strict`
// enforces this at runtime.
const loadFeatures = () => import('framer-motion').then((mod) => mod.domAnimation)

export function LazyMotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  )
}
