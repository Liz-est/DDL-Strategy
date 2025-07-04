import { NextResponse } from 'next/server'

import { getAppList } from '@/services/app/multiApp'

/**
 * 获取应用列表
 */
export async function GET() {
	const result = await getAppList()
	return NextResponse.json(result)
}
