import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
	/* config options here */
	env: {
		PROJECT_ROOT: path.resolve(__dirname),
	},
	// build 期间忽略 eslint 检查
	eslint: {
		ignoreDuringBuilds: true,
	},
	// build 期间忽略 typescript 检查
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
