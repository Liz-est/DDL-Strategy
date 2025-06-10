import AppsPageMain from "./content-client";
import { getUser } from "../actions";
import { getAppList } from "./actions";

export default function AppsPage() {
	// 定义用于 Client 组件的 Promise 请求
	const user = getUser();
	const getApps = getAppList();
	return <AppsPageMain user={user} getApps={getApps} />;
}
