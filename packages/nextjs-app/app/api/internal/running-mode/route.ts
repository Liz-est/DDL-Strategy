import { NextResponse } from 'next/server'

import { getRunningModeAction } from '@/app/actions'

export const GET = async () => {
	const runningMode = await getRunningModeAction()
	return NextResponse.json({
		code: 0,
		data: runningMode,
		message: 'success',
	})
}
