"use client";
import PageLayoutWrapper from "@/components/layout/page-layout-wrapper";
import React from "react";

export default function AppsPageLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <PageLayoutWrapper>{children}</PageLayoutWrapper>;
}
