import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	output: 'standalone',
	// ESLint 9 + FlatCompat(extends `eslint-config-next`) yields a circular config graph that Next
	// tries to JSON-serialize during `next build` / `next lint`, which throws. Run ESLint via CLI
	// when migrating to a native flat config (see eslint.config.mjs).
	eslint: {
		ignoreDuringBuilds: true,
	},
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					// 支持跨域
					{ key: 'Access-Control-Allow-Credentials', value: 'true' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
					{
						key: 'Access-Control-Allow-Headers',
						value:
							'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-USER-ID',
					},
				],
			},
		]
	},
}

export default nextConfig
