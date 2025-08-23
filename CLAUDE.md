# Claude Code 项目记忆文档

## 项目概述
这是一个订阅管理应用，包含前端React应用和后端FastAPI服务，支持Auth0认证和Modal.com部署。

## 重要配置和约定

### 前端 (React + TypeScript + Vite)

#### 已知问题和解决方案

1. **axios导入问题**
   ```typescript
   // ❌ 错误 - AxiosInstance不是命名导出
   import axios, { AxiosInstance } from 'axios';
   
   // ✅ 正确 - 使用类型导入
   import axios from 'axios';
   import type { AxiosInstance } from 'axios';
   ```

2. **TypeScript严格模式配置**
   - 项目使用`verbatimModuleSyntax: true`
   - 所有类型必须使用`type`关键字导入
   ```typescript
   // ❌ 错误
   import { ReactNode } from 'react';
   
   // ✅ 正确  
   import type { ReactNode } from 'react';
   ```

3. **未使用变量处理**
   - 如果变量在setter中使用但TypeScript报告未使用，使用`@ts-ignore`注释
   ```typescript
   // @ts-ignore: totalDays used in setTotalDays call
   const [totalDays, setTotalDays] = useState(0);
   ```

#### 路径别名配置
- `@/` 映射到 `./src/`
- 已在`tsconfig.app.json`和`vite.config.ts`中正确配置

#### CSS配置
- 使用Tailwind CSS
- 主要CSS文件：`src/index.css`、`src/styles/animations.css`
- CSS导入问题已解决

### 常见构建错误及解决方案

#### 白屏问题排查流程
1. **检查模块导入错误** - 最常见原因
2. **检查TypeScript类型导入** - 确保使用正确的导入语法
3. **检查路径别名** - 确保@/路径正确解析
4. **逐步简化组件** - 使用动态导入定位问题

#### 构建警告处理原则
1. **理解警告原因** - 不要盲目删除代码
2. **搜索完整使用** - 检查变量/函数在整个文件中的使用
3. **保守处理** - 宁可保留代码并添加注释
4. **单个修改测试** - 每修改一项就测试一次

#### API数据类型不匹配错误 (422 Unprocessable Entity)
**问题：** 前端和后端对同一字段使用不同数据类型
**示例：** `service_id` 前端为 `string`，后端为 `int`
**解决方案：**
1. 统一数据类型定义（推荐前端string，后端在处理时转换）
2. 后端在 schema 中使用 `str` 类型，在数据库操作时转换为 `int`
3. 前端移除不必要的类型转换代码
**修复记录：** 2025-08-21 已修复 service_id 类型不匹配问题

### 依赖包相关

#### 正常的第三方包导入（已验证无问题）
- `date-fns` - 日期处理
- `lucide-react` - 图标组件
- `@auth0/auth0-react` - 认证
- `recharts` - 图表组件  
- `class-variance-authority` - CSS变体
- `@radix-ui/*` - UI组件
- `framer-motion` - 动画
- `clsx`、`tailwind-merge` - CSS工具

### Auth0配置

#### 开发环境设置
```env
# 禁用Auth0（开发时）
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_AUDIENCE=

# 启用Auth0（生产时）
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-api-identifier
```

#### 组件配置
- `AuthProvider` 和 `AuthGuard` 在Auth0未配置时会自动跳过认证
- 后端API在Auth0未配置时返回mock用户数据

### 后端 (FastAPI + Modal.com)

#### 认证配置
- 支持JWT token验证
- Auth0公钥动态获取
- 未配置时自动降级为mock认证

#### Modal部署要求
```python
# 必需的secrets
modal.Secret.from_name("neon-db-url")
modal.Secret.from_name("openrouter-api-key") 
modal.Secret.from_name("auth0-config")  # AUTH0_DOMAIN, AUTH0_AUDIENCE
```

## 调试和故障排除

### 白屏问题快速排查
1. 打开浏览器开发者工具查看控制台错误
2. 检查是否有模块导入失败的错误
3. 使用动态导入和错误边界定位问题组件
4. 检查TypeScript编译错误

### 构建失败快速修复
1. 检查axios相关导入 - 使用类型导入
2. 检查React类型导入 - 使用`import type`
3. 处理未使用变量警告 - 添加@ts-ignore注释
4. 验证路径别名配置

### 常用命令
```bash
# 开发
npm run dev

# 构建（会进行TypeScript检查）
npm run build

# 预览构建结果
npm run preview
```

## 性能优化建议

### Bundle大小优化
当前JS bundle约888KB，可考虑：
1. 动态导入大型组件
2. 移除未使用的依赖
3. 使用Rollup手动chunk配置
4. 检查重复依赖

### 推荐的代码分割点
- Auth0相关组件（仅在启用认证时加载）
- 图表组件（Analytics页面）
- 表单组件（按需加载）

## 调试经验和常见错误

### Auth0认证问题

#### 1. API请求时序问题（已解决）
**问题：** 前端虽然获取了Auth0 access token，但API请求仍返回401未授权错误
**原因：** API实例在token获取之前就被创建，导致Authorization头为空
**解决方案：** 
- 在`useAuthenticatedApi`中添加`isTokenReady`状态
- 在App组件中等待`isTokenReady`为true后再发起API请求
- 使用`useMemo`确保token变化时重新创建API实例

**关键代码修改：**
```typescript
// auth-client.ts
const [isTokenReady, setIsTokenReady] = useState(false);
// App.tsx  
useEffect(() => {
  if (!isLoading && authenticatedApi.isTokenReady) {
    loadData();
  }
}, [useApi, isAuthenticated, isLoading, authenticatedApi.isTokenReady]);
```

#### 2. JWT token作用域问题（已解决）
**问题：** Auth0认证成功，token发送正确，但后端报"Invalid user information"错误
**原因：** JWT token中缺少email字段，只有sub字段
**解决方案：** 
- 修改数据库模型，将email字段设为可选 (`nullable=True`)
- 移除email字段的unique约束
- 后端只依赖`auth0_user_id`(sub)进行用户识别
- 不再要求email字段必填

**关键代码修改：**
```python
# models.py
email = Column(String, nullable=True, index=True)  # Email is optional

# main.py
async def get_or_create_user(user_info: dict, db: AsyncSession):
    auth0_user_id = user_info.get("sub")
    if not auth0_user_id:
        raise HTTPException(status_code=400, detail="Invalid user information: missing user ID")
    email = user_info.get("email")  # Optional
```

### 数据库表结构管理 (Neon PostgreSQL)

#### 数据库连接配置
```env
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_xxx@ep-xxx.c-2.us-east-2.aws.neon.tech/neondb?ssl=require
```

#### 表结构修改流程

**⚠️ 重要：Neon数据库表结构修改步骤**

1. **准备阶段**
   ```bash
   # 确保本地环境变量正确
   cd backend/
   # 检查当前数据库连接
   python -c "from database import DATABASE_URL; print(DATABASE_URL)"
   ```

2. **清理旧数据（如需要）**
   ```python
   # 在Python中执行清理脚本
   python -c "
   import asyncio
   from database import engine
   from sqlalchemy import text

   async def clear_database():
       async with engine.begin() as conn:
           # 按依赖顺序删除表
           await conn.execute(text('DROP TABLE IF EXISTS subscriptions CASCADE;'))
           await conn.execute(text('DROP TABLE IF EXISTS services CASCADE;'))
           await conn.execute(text('DROP TABLE IF EXISTS users CASCADE;'))
           print('所有表已删除')
       await engine.dispose()

   asyncio.run(clear_database())
   "
   ```

3. **重新创建表结构**
   ```python
   # 使用当前models.py定义创建表
   python -c "
   import asyncio
   from database import engine, Base

   async def recreate_tables():
       async with engine.begin() as conn:
           await conn.run_sync(Base.metadata.create_all)
           print('表结构已重新创建')
       await engine.dispose()

   asyncio.run(recreate_tables())
   "
   ```

4. **验证表结构**
   ```bash
   # 启动应用验证
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   # 测试API连接
   curl http://localhost:8000/
   ```

#### 数据库性能优化配置

**Neon数据库连接优化：**
```python
# database.py 配置
engine = create_async_engine(
    DATABASE_URL, 
    echo=False,  # 关闭SQL日志提升性能
    pool_size=5,  # 适应Neon连接限制
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=1800,  # 30分钟回收连接
    connect_args={
        "command_timeout": 5,
        "server_settings": {
            "application_name": "subscription_app",
            "jit": "off"
        }
    }
)
```

#### 常见数据库错误及解决方案

1. **UUID vs Integer 类型冲突**
   - **错误：** `operator does not exist: integer = uuid`
   - **原因：** 表中存在整数ID，但模型期望UUID
   - **解决：** 清理所有表并重新创建（见上述流程）

2. **连接超时问题**
   - **错误：** API响应缓慢或超时
   - **解决：** 应用上述性能优化配置
   - **跳过启动时表检查：** 在 `main.py` 中设置 `startup_event` 为 `pass`

#### 数据库迁移最佳实践

1. **开发环境：** 可以直接删除重建表
2. **生产环境：** 使用Alembic进行增量迁移
3. **表结构变更：** 优先修改models.py，然后执行上述重建流程
4. **数据备份：** Neon提供自动备份，重要变更前可手动创建分支

---

**最后更新：** 2025-08-23  
**重要提醒：** 修改Neon数据库表结构前，务必按照上述流程操作，避免数据类型冲突