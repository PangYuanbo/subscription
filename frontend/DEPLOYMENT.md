# 部署指南 - Deployment Guide

## 自动配置说明 - Automatic Configuration

### 前端部署到 Vercel 时自动对接 Modal 后端
When the frontend is deployed to Vercel, it will automatically connect to the Modal backend.

**配置说明 - Configuration Details:**

- **本地开发 (Local Development):** `http://localhost:8000`
- **Vercel 部署 (Vercel Deployment):** `https://yuanbopang--subscription-manager-fastapi-app.modal.run`

### 环境检测逻辑 - Environment Detection Logic

应用会自动检测运行环境并选择合适的 API 端点：
The app automatically detects the runtime environment and selects the appropriate API endpoint:

1. **开发模式 (Development Mode):** 使用本地 API 或 `VITE_API_URL` 环境变量
2. **Vercel 部署 (Vercel Deployment):** 自动检测 `vercel.app` 域名并使用 Modal 后端
3. **生产模式 (Production Mode):** 默认使用 Modal 后端
4. **自定义配置 (Custom Configuration):** `VITE_API_URL` 环境变量优先

### Vercel 部署链接 - Vercel Deployment Links

- **前端地址 (Frontend URL):** https://subscription-jzttckl7a-pangyuanbos-projects.vercel.app/
- **后端地址 (Backend URL):** https://yuanbopang--subscription-manager-fastapi-app.modal.run

### 环境变量配置 - Environment Variables

**.env (本地开发 - Local Development):**
```env
VITE_API_URL=http://localhost:8000
```

**.env.production (生产环境 - Production):**
```env
# API URL 将自动设置为 Modal 后端
# API URL will be automatically set to Modal backend
```

### 部署步骤 - Deployment Steps

1. **构建项目 (Build Project):**
   ```bash
   npm run build
   ```

2. **部署到 Vercel (Deploy to Vercel):**
   - 推送代码到 GitHub
   - Vercel 自动部署
   - 应用自动连接到 Modal 后端

3. **验证连接 (Verify Connection):**
   - 访问 Vercel 应用
   - 检查浏览器控制台的 API 配置日志
   - 确认 API 请求指向 Modal 后端

### 调试信息 - Debug Information

应用启动时会在浏览器控制台显示配置信息：
The app displays configuration information in the browser console on startup:

```javascript
API Configuration: {
  baseURL: "https://yuanbopang--subscription-manager-fastapi-app.modal.run",
  isDev: false,
  isProd: true,
  hostname: "subscription-jzttckl7a-pangyuanbos-projects.vercel.app",
  hasCustomUrl: false,
  hasVercelUrl: true
}
```