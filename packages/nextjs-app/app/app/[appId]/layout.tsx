'use client'

import React from 'react'

import PageLayoutWrapper from '@/components/layout/page-layout-wrapper'

export default function AppPageLayout({ children }: { children: React.ReactNode }) {
	return <PageLayoutWrapper>{children}</PageLayoutWrapper>
}
