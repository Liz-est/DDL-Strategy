'use client'

import React from 'react'

import PageLayoutWrapper from '@/components/layout/page-layout-wrapper'

export default function AppsPageLayout({ children }: { children: React.ReactNode }) {
	return <PageLayoutWrapper>{children}</PageLayoutWrapper>
}
