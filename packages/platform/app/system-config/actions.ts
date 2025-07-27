'use server'

import { prisma } from '@/lib/prisma'

interface DatabaseStatus {
	totalApps: number
	storageType: 'database'
}

/**
 * 获取数据库状态
 */
export async function getDatabaseStatus(): Promise<DatabaseStatus> {
	try {
		const totalApps = await prisma.difyApp.count()

		return {
			totalApps,
			storageType: 'database',
		}
	} catch (error) {
		console.error('Error getting database status:', error)
		throw new Error('Failed to get database status')
	}
}
