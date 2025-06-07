"use client";
import PageLayoutWrapper from "@/components/layout/page-layout-wrapper";

export default function AppsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <PageLayoutWrapper>{children}</PageLayoutWrapper>;
}
