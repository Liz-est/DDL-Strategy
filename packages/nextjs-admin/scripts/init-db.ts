#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 初始化 Dify Chat Admin 数据库...\n')

// 检查是否存在 .env 文件
const envPath = path.join(__dirname, '..', '.env')
const envExamplePath = path.join(__dirname, '..', '.env.example')

if (!fs.existsSync(envPath)) {
	if (fs.existsSync(envExamplePath)) {
		console.log('📝 创建 .env 文件...')
		fs.copyFileSync(envExamplePath, envPath)
		console.log('✅ .env 文件已创建\n')
	} else {
		console.log('📝 创建默认 .env 文件...')
		const defaultEnv = `# Database - 开发环境配置
DATABASE_URL="file:./prisma/dev.db"
`
		fs.writeFileSync(envPath, defaultEnv)
		console.log('✅ 默认 .env 文件已创建\n')
	}
}

try {
	// 生成 Prisma 客户端
	console.log('🔧 生成 Prisma 客户端...')
	execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
	console.log('✅ Prisma 客户端生成完成\n')

	// 推送数据库模式
	console.log('🗄️ 初始化数据库模式...')
	execSync('npx prisma db push', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
	console.log('✅ 数据库模式初始化完成\n')

	console.log('🎉 数据库初始化完成！')
	console.log('\n📋 接下来你可以：')
	console.log('   • 运行 pnpm dev 启动开发服务器')
	console.log('   • 运行 pnpm db:studio 打开数据库管理界面')
	console.log('   • 运行 pnpm db:seed 添加示例数据')
} catch (error) {
	console.error('❌ 初始化失败:', error instanceof Error ? error.message : String(error))
	process.exit(1)
}
