import { JWTPayload, jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import 'server-only'

import { getConfigs } from '@/config'

export interface SessionPayload extends JWTPayload {
	userId: string
}

const secretKey = getConfigs().SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

/**
 * Session Key
 */
export const SESSION_KEY_NAME = '__DC_SESSION'

/**
 * 生成 session
 */
export async function encrypt(payload: SessionPayload) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(encodedKey)
}

/**
 * 解析 session
 */
export async function decrypt(session: string) {
	try {
		const { payload } = await jwtVerify(session, encodedKey, {
			algorithms: ['HS256'],
		})
		return payload
	} catch (error) {
		return {
			error,
		}
	}
}

/**
 * 从 NextRequest 中解析 session
 */
export async function getUserIdFromNextRequest(request: NextRequest) {
	const session = request.cookies.get(SESSION_KEY_NAME)?.value
	const result = await decrypt(session as string)
	if (result.error) {
		return ''
	}
	return result.userId as string
}

/**
 * 创建 session 并设置 cookie
 */
export async function createSession(info: { userId: string; enableSetting: boolean }) {
	// 设置 7 天过期
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
	const session = await encrypt(info)
	const cookieStore = await cookies()

	cookieStore.set(SESSION_KEY_NAME, session, {
		httpOnly: true,
		// 只有生产环境才设置 secure
		secure: process.env.NODE_ENV === 'production',
		expires: expiresAt,
		sameSite: 'lax',
		path: '/',
	})
}
