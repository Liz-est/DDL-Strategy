#!/usr/bin/env npx tsx
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCHEMA_DIR = path.join(__dirname, '..', 'prisma')
const TEMPLATES_DIR = path.join(SCHEMA_DIR, 'templates')
const MAIN_SCHEMA = path.join(SCHEMA_DIR, 'schema.prisma')
const SQLITE_TEMPLATE = path.join(TEMPLATES_DIR, 'schema.sqlite.template')
const POSTGRESQL_TEMPLATE = path.join(TEMPLATES_DIR, 'schema.postgresql.template')

function showUsage() {
	console.log(`
数据库切换工具

用法:
  npx tsx scripts/switch-db.ts <provider>

支持的 provider:
  sqlite      - 切换到 SQLite 数据库
  postgresql  - 切换到 PostgreSQL 数据库

示例:
  npx tsx scripts/switch-db.ts sqlite
  npx tsx scripts/switch-db.ts postgresql

环境变量配置:
  SQLite:     DATABASE_URL="file:./prisma/dev.db"
  PostgreSQL: DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
`)
}

function switchDatabase(provider: string): void {
	let sourceTemplate

	switch (provider.toLowerCase()) {
		case 'sqlite':
			sourceTemplate = SQLITE_TEMPLATE
			console.log('🔄 切换到 SQLite 数据库...')
			break
		case 'postgresql':
		case 'postgres':
			sourceTemplate = POSTGRESQL_TEMPLATE
			console.log('🔄 切换到 PostgreSQL 数据库...')
			break
		default:
			console.error(`❌ 不支持的数据库类型: ${provider}`)
			showUsage()
			process.exit(1)
	}

	// 检查源模板文件是否存在
	if (!fs.existsSync(sourceTemplate)) {
		console.error(`❌ 模板文件不存在: ${sourceTemplate}`)
		process.exit(1)
	}

	try {
		// 备份当前 schema
		if (fs.existsSync(MAIN_SCHEMA)) {
			const backupPath = `${MAIN_SCHEMA}.backup.${Date.now()}`
			fs.copyFileSync(MAIN_SCHEMA, backupPath)
			console.log(`📦 已备份当前 schema 到: ${path.basename(backupPath)}`)
		}

		// 复制新的 schema
		fs.copyFileSync(sourceTemplate, MAIN_SCHEMA)
		console.log(`✅ 已切换到 ${provider} 数据库配置`)

		// 显示环境变量提示
		console.log('\n📝 请确保设置正确的环境变量:')
		if (provider.toLowerCase() === 'sqlite') {
			console.log('   DATABASE_URL="file:./prisma/dev.db"')
		} else {
			console.log('   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"')
		}

		console.log('\n🔧 接下来的步骤:')
		console.log('   1. 检查 .env 文件中的 DATABASE_URL')
		console.log('   2. 运行: pnpm db:generate')
		console.log('   3. 运行: pnpm db:push (或 pnpm db:migrate)')
	} catch (error: unknown) {
		console.error(`❌ 切换失败: ${error instanceof Error ? error.message : String(error)}`)
		process.exit(1)
	}
}

// 主程序
const args = process.argv.slice(2)

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
	showUsage()
	process.exit(0)
}

const provider = args[0]
switchDatabase(provider)
