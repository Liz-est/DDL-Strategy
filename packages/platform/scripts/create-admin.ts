import bcrypt from 'bcryptjs'

import { prisma } from '../lib/prisma'

async function createAdmin() {
	const email = 'admin@example.com'
	const password = 'admin123'
	const name = '系统管理员'

	// 检查管理员是否已存在
	const existingUser = await prisma.user.findUnique({
		where: { email },
	})

	if (existingUser) {
		console.log('管理员账户已存在')
		return
	}

	// 加密密码
	const hashedPassword = await bcrypt.hash(password, 12)

	// 创建管理员账户
	const admin = await prisma.user.create({
		data: {
			email,
			password: hashedPassword,
			name,
		},
	})

	console.log('管理员账户创建成功:')
	console.log(`邮箱: ${admin.email}`)
	console.log(`密码: ${password}`)
	console.log(`姓名: ${admin.name}`)
}

createAdmin()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
