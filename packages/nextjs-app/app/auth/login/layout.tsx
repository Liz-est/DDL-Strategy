"use client";
import PageLayoutWrapper from "@/components/layout/page-layout-wrapper";
import React from "react";

export default function AppPageLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <PageLayoutWrapper>{children}</PageLayoutWrapper>;
}
