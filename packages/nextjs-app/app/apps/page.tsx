import { getUser } from "@/app/actions";
import { getAppList } from "@/app/apps/actions";

import { Empty, Row } from "antd";

import AddButton from "@/app/apps/components/add-button";
import AppItem from "@/app/apps/components/app-item";
import Header from "@/app/apps/components/header";

export default async function AppsPage() {
	const user = await getUser();
	const apps = await getAppList();

	const refreshApps = getAppList;

	return (
		<div className="h-screen relative overflow-hidden flex flex-col bg-theme-bg w-full">
			<Header />
			<div className="flex-1 bg-theme-main-bg rounded-3xl py-6 overflow-y-auto box-border overflow-x-hidden">
				{apps?.length ? (
					<Row gutter={[16, 16]} className="px-3 md:px-6">
						{apps.map((item) => {
							return <AppItem key={item.id} item={item} user={user} />;
						})}
					</Row>
				) : (
					<div className="w-full h-full box-border flex flex-col items-center justify-center px-3">
						<Empty description="暂无应用" />
					</div>
				)}
			</div>

			{user.enableSetting ? <AddButton refreshApps={refreshApps} /> : null}
		</div>
	);
}
