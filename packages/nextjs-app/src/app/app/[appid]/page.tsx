"use client";

import { useParams } from "next/navigation";

export default function AppPage() {
	const params = useParams();

	console.log("params", params);

	return <div>AppPage</div>;
}
