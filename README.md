# Subscription Manager 订阅管理系统

一个现代化的订阅服务管理平台，采用简洁极简的UI设计，帮助用户追踪和管理各种订阅服务的费用。

[English](#english) | [中文](#chinese)

<a name="chinese"></a>
## 🌟 主要功能

### 核心功能
- **订阅管理**：添加、编辑、删除订阅服务
- **费用分析**：月度/年度费用统计，分类支出分析
- **试用期追踪**：
  - 自动计算试用期剩余天数
  - 可视化状态指示（活跃、即将到期、已过期）
  - 支持常见试用期时长（7、14、30、60、90天）
- **到期提醒**：智能提醒即将到期的订阅（自动续费订阅除外）
- **自然语言输入**：通过描述或截图快速添加订阅
- **实际支出追踪**：对比预算与实际支出

### 特色功能
- 🎨 50+ 预定义服务图标（包括国内外主流服务）
- 🔍 智能服务识别和自动图标生成
- 📊 多维度数据可视化分析
- 🌐 灵活的图标存储策略（URL/Base64）
- 🔒 Auth0 身份认证（可选）
- ☁️ 本地存储或云端数据同步
- 🌙 简洁极简的UI设计

## 🚀 快速开始

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

### 后端开发

```bash
cd backend
pip install -r requirements.txt
python main.py
```

API 服务运行在 http://localhost:8000
API 文档：http://localhost:8000/docs

## 🛠️ 技术栈

### 前端
- **框架**：React 19 + TypeScript
- **构建工具**：Vite
- **UI组件**：shadcn/ui + Radix UI
- **样式**：Tailwind CSS
- **图表**：Recharts
- **图标**：Lucide React
- **认证**：Auth0 React SDK

### 后端
- **框架**：FastAPI
- **数据库**：PostgreSQL (Neon)
- **ORM**：SQLAlchemy (异步)
- **认证**：JWT (Auth0)
- **AI集成**：OpenRouter API
- **部署**：Modal.com

## 📦 项目结构

```
subscription/
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── api/          # API客户端
│   │   ├── hooks/        # 自定义Hooks
│   │   ├── utils/        # 工具函数
│   │   ├── data/         # 预定义数据
│   │   └── types/        # TypeScript类型
│   └── dist/             # 构建输出
├── backend/               # 后端服务
│   ├── main.py          # FastAPI应用
│   ├── models.py        # 数据库模型
│   ├── schemas.py       # Pydantic模型
│   ├── database.py      # 数据库配置
│   └── modal_app.py     # Modal部署配置
└── CLAUDE.md            # 项目记忆文档
```

## 🔧 环境配置

### 前端环境变量 (.env)

```env
# API配置
VITE_API_URL=http://localhost:8000

# Auth0配置（可选）
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-identifier
```

### 后端环境变量 (.env)

```env
# 数据库
DATABASE_URL=postgresql+asyncpg://user:pass@host/db

# OpenRouter (用于AI功能)
OPENROUTER_API_KEY=your-api-key

# Auth0（可选）
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=your-api-identifier
```

## 🎯 最新更新 (2025-08-24)

### 新功能
1. **自动续费订阅优化**：设置了auto_pay的订阅不再触发过期提醒
2. **Monthly Spending UI升级**：
   - 内联编辑模式，单行独立编辑
   - 实时状态指示（Saved/Over/Pending）
   - 统计摘要卡片
3. **图标存储策略升级**：
   - 支持URL动态获取和Base64缓存
   - 新增icon_source_url字段追踪来源
   - 三种输入方式：Website URL、Direct URL、Upload

### Bug修复
- 修复Windows环境lucide-react图标问题
- 修复Select组件缺失问题
- 修复TypeScript类型检查错误

## 🎨 图标系统

### 预定义服务（50+）
包含国内外主流服务：
- **娱乐**：Netflix、Spotify、YouTube Premium、爱奇艺、腾讯视频、哔哩哔哩等
- **开发**：GitHub、GitLab、JetBrains、Figma、Adobe Creative Cloud等
- **云服务**：AWS、Google Cloud、Azure、阿里云、腾讯云等
- **生产力**：Slack、Discord、Zoom、Notion、Microsoft 365、钉钉等

### 自动生成图标
对于未预定义的服务：
- 自动生成彩色首字母图标
- 基于服务名的确定性颜色
- 高对比度确保可读性

## 📊 分析功能

- **饼图**：按类别展示费用分布
- **柱状图**：月度支出趋势对比
- **面积图**：年度预测vs实际支出
- **统计卡片**：总月费、年费预测、活跃服务数、平均费用

## 🚀 部署

### 前端部署（Vercel）

```bash
# 1. 推送代码到GitHub
# 2. 在Vercel连接GitHub仓库
# 3. 设置根目录为frontend
# 4. 添加环境变量VITE_API_URL
# 5. 部署
```

### 后端部署（Modal）

```bash
# 安装Modal CLI
pip install modal

# 认证
modal setup

# 创建数据库密钥
modal secret create neon-db-url DATABASE_URL=your_connection_string

# 部署
cd backend
modal deploy modal_app.py
```

## 📝 开发说明

### Windows开发环境注意事项

如遇到lucide-react chrome.js错误：
```bash
# 手动创建dummy文件
echo "const Chrome = () => null; export default Chrome;" > node_modules/lucide-react/dist/esm/icons/chrome.js

# 清除缓存
rm -rf node_modules/.vite

# 安装依赖
npm install react-is
```

### 构建和测试

```bash
# 前端构建
cd frontend
npm run build

# 预览构建
npm run preview

# 类型检查
npm run type-check
```

## 📊 性能指标

- 前端包大小：~1MB (gzip: ~322KB)
- 首屏加载：< 2s
- API响应：< 200ms
- 数据库查询：< 100ms

---

<a name="english"></a>
## 🌟 Features

### Core Features
- **Subscription Management**: Add, edit, and delete subscription services
- **Cost Analytics**: Monthly/annual cost statistics and category breakdown
- **Free Trial Tracking**: 
  - Auto-calculate remaining trial days
  - Visual status indicators
  - Support common trial durations
- **Expiration Alerts**: Smart reminders for expiring subscriptions (excludes auto-renew)
- **Natural Language Input**: Quick add subscriptions via description or screenshot
- **Actual Spending Tracking**: Compare budget vs actual expenses

### Highlights
- 🎨 50+ predefined service icons
- 🔍 Smart service recognition
- 📊 Multi-dimensional data visualization
- 🌐 Flexible icon storage (URL/Base64)
- 🔒 Auth0 authentication (optional)
- ☁️ Local or cloud data sync
- 🌙 Clean minimalist UI design

## 🚀 Quick Start

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

### Backend Development

```bash
cd backend
pip install -r requirements.txt
python main.py
```

API runs on http://localhost:8000
API docs: http://localhost:8000/docs

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License

## 👨‍💻 Author

Aaron

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Lucide](https://lucide.dev/) - Icons
- [Modal](https://modal.com/) - Deployment platform
- [Neon](https://neon.tech/) - Database service

---

**Note**: For detailed development guide and troubleshooting, see [CLAUDE.md](./CLAUDE.md)