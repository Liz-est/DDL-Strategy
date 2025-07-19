# 客户端 API 接口文档

本文档描述了 Dify Chat Platform 为客户端应用（如 react-app）提供的 API 接口。

## 基础信息

- **基础 URL**: `http://localhost:3000/api/client` (开发环境)
- **响应格式**: JSON
- **错误处理**: 统一的错误响应格式

## 应用管理 API

### 1. 获取应用列表

**接口**: `GET /api/client/apps`

**描述**: 获取所有可用的应用列表，API Key 会被隐藏以保护安全性。

**响应示例**:

```json
[
  {
    "id": "app-123",
    "info": {
      "name": "聊天助手",
      "description": "智能聊天助手应用",
      "tags": ["聊天", "AI"],
      "mode": "chat"
    },
    "requestConfig": {
      "apiBase": "https://api.dify.ai/v1",
      "apiKey": "******"
    },
    "answerForm": {
      "enabled": false
    },
    "inputParams": {
      "enableUpdateAfterCvstStarts": false
    }
  }
]
```

### 2. 获取单个应用详情

**接口**: `GET /api/client/apps/{id}`

**参数**:

- `id` (路径参数): 应用 ID

**描述**: 获取指定应用的详细信息，API Key 会被隐藏。

**响应示例**:

```json
{
  "id": "app-123",
  "info": {
    "name": "聊天助手",
    "description": "智能聊天助手应用",
    "tags": ["聊天", "AI"],
    "mode": "chat"
  },
  "requestConfig": {
    "apiBase": "https://api.dify.ai/v1",
    "apiKey": "******"
  }
}
```

## Dify API 代理

所有 Dify API 请求都通过平台代理，确保 API Key 安全性。

### 1. 发送聊天消息

**接口**: `POST /api/client/dify/{appId}/chat-messages`

**参数**:

- `appId` (路径参数): 应用 ID

**请求体**:

```json
{
  "query": "你好",
  "conversation_id": "conv-123",
  "response_mode": "streaming",
  "inputs": {}
}
```

**描述**: 向指定应用发送聊天消息，支持流式和非流式响应。

### 2. 获取会话列表

**接口**: `GET /api/client/dify/{appId}/conversations`

**参数**:

- `appId` (路径参数): 应用 ID
- `limit` (查询参数): 返回数量限制，默认 20

**描述**: 获取指定应用的会话列表。

### 3. 获取会话消息历史

**接口**: `GET /api/client/dify/{appId}/conversation/{conversationId}/messages`

**参数**:

- `appId` (路径参数): 应用 ID
- `conversationId` (路径参数): 会话 ID

**描述**: 获取指定会话的消息历史。

### 4. 获取应用参数

**接口**: `GET /api/client/dify/{appId}/parameters`

**参数**:

- `appId` (路径参数): 应用 ID

**描述**: 获取应用的参数配置，包括开场白、建议问题等。

## 错误响应格式

所有 API 在出错时都会返回统一的错误格式：

```json
{
  "error": "错误描述信息"
}
```

常见的 HTTP 状态码：

- `200`: 成功
- `404`: 资源不存在
- `500`: 服务器内部错误

## 使用示例

### JavaScript/TypeScript 客户端

```typescript
// 获取应用列表
const getApps = async () => {
  const response = await fetch('/api/client/apps')
  if (!response.ok) {
    throw new Error('Failed to fetch apps')
  }
  return response.json()
}

// 获取单个应用
const getApp = async (id: string) => {
  const response = await fetch(`/api/client/apps/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch app')
  }
  return response.json()
}

// 发送聊天消息
const sendMessage = async (appId: string, message: string) => {
  const response = await fetch(`/api/client/dify/${appId}/chat-messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: message,
      response_mode: 'streaming',
    }),
  })

  return response
}
```

## 安全性说明

1. **API Key 保护**: 所有 Dify API 调用都在服务端进行，客户端永远不会接触到真实的 API Key
2. **请求代理**: 客户端通过平台代理访问 Dify API，增加了一层安全控制
3. **错误处理**: 统一的错误处理机制，避免敏感信息泄露

## 部署配置

### 开发环境

```bash
# 启动平台服务
cd packages/nextjs-admin
npm run dev

# 客户端应用配置
API_BASE_URL=http://localhost:3000/api/client
```

### 生产环境

```bash
# 客户端应用配置
API_BASE_URL=https://your-platform-domain.com/api/client
```

## 注意事项

1. 所有 API 请求都需要通过平台代理，不要直接调用 Dify API
2. 应用配置中的 API Key 在客户端 API 中会被隐藏，这是正常的安全措施
3. 流式响应需要特殊处理，参考上面的示例代码
4. 建议在客户端实现适当的错误处理和重试机制
