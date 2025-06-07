import { AntdRegistry } from "@ant-design/nextjs-registry";

export default function EntryWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AntdRegistry>{children}</AntdRegistry>;
}
