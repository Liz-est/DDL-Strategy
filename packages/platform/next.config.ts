import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	output: 'standalone',
	serverExternalPackages: ['@prisma/client', 'prisma'],
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
							'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
					},
				],
			},
		]
	},
}

export default nextConfig
