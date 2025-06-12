import PageLayoutWrapper from "@/components/layout/page-layout-wrapper";

export default function ConsoleAppsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <PageLayoutWrapper>{children}</PageLayoutWrapper>;
}
