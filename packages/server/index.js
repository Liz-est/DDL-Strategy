const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const Router = require('koa-router')
const fs = require('fs')
const path = require('path')
const cors = require('koa-cors')

const app = new Koa()
const router = new Router()
app.use(bodyParser())
app.use(cors())

const dataFilePath = path.join(__dirname, 'apps.json')

// 读取数据
const readData = () => {
	try {
		const data = fs.readFileSync(dataFilePath, 'utf8')
		return JSON.parse(data)
	} catch (error) {
		return []
	}
}

// 写入数据
const writeData = data => {
	fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2))
}

// 获取所有应用
router.get('/apps', async ctx => {
	const apps = readData()
	ctx.body = apps
})

// 根据 ID 获取应用
router.get('/apps/:id', async ctx => {
	const id = ctx.params.id
	const apps = readData()
	const app = apps.find(app => app.id === id)
	if (app) {
		ctx.body = app
	} else {
		ctx.status = 404
		ctx.body = { message: 'App not found' }
	}
})

// 新增应用
router.post('/apps', async ctx => {
	const newApp = ctx.request.body
	const apps = readData()
	// 如果id为空，则生成一个
	if (!newApp.id) {
		newApp.id = Date.now().toString()
	}
	apps.push(newApp)
	writeData(apps)
	ctx.status = 201
	ctx.body = newApp
})

// 更新应用
router.put('/apps/:id', async ctx => {
	const id = ctx.params.id
	const updatedApp = ctx.request.body
	const apps = readData()
	const index = apps.findIndex(app => app.id === id)
	if (index !== -1) {
		apps[index] = updatedApp
		writeData(apps)
		ctx.body = updatedApp
	} else {
		ctx.status = 404
		ctx.body = { message: 'App not found' }
	}
})

// 删除应用
router.delete('/apps/:id', async ctx => {
	const id = ctx.params.id
	const apps = readData()
	const newApps = apps.filter(app => app.id !== id)
	writeData(newApps)
	ctx.status = 204
})

app.use(router.routes())
app.use(router.allowedMethods()) // 允许

app.use(async (ctx, next) => {
	// 设置响应头以允许跨域请求
	ctx.set('Access-Control-Allow-Origin', '*') // 或者具体的域名如 'https://example.com'
	ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
	ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
	ctx.set('Access-Control-Allow-Credentials', 'true') // 如果需要凭证信息的话
	if (ctx.method === 'OPTIONS') {
		// 如果请求方法是OPTIONS，则直接返回状态204，表示预检请求成功即可。
		ctx.status = 204 // No Content
	} else {
		await next() // 继续执行其他中间件或路由处理函数
	}
})

const port = 3000
app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})
