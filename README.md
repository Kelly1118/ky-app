# 恋爱记录应用 💕

一个用于记录恋爱时光的温馨网页应用，支持记录美好回忆、心情状态，并提供优雅的界面展示。

## ✨ 功能特性

- 📝 **记录管理**: 添加、编辑、删除恋爱记录，支持完整的增删改查操作
- 🏷️ **分类标签**: K栏、Y栏、K&Y栏三种记录类型
- 😊 **心情记录**: 开心、甜蜜、兴奋、难过等心情状态
- 🎉 **纪念日管理**: 完整的纪念日增删改查功能，支持重复提醒
- 📊 **操作日志**: 详细记录所有数据操作，包括IP地址和时间戳
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🎨 **优雅界面**: 现代化UI设计，温馨浪漫风格
- 🔍 **搜索筛选**: 按分类、心情、日期筛选记录
- 💾 **数据持久化**: MySQL数据库存储，数据安全可靠
- 🔒 **安全审计**: 完整的操作日志记录，支持数据追溯

## 🚀 快速开始

### 环境要求

- Docker & Docker Compose
- Git
- 服务器或本地环境

### 一键部署

1. **克隆项目**
```bash
git clone https://github.com/Kelly1118/ky.git
cd ky
```

2. **配置环境**
```bash
cp .env.example .env
# 编辑.env文件，配置数据库连接信息（通常无需修改）
```

3. **执行部署**
```bash
chmod +x deploy.sh
./deploy.sh
```

4. **访问应用**
- 主域名: http://ky11181014.example.com
- 备用域名: http://www.ky11181014.example.com
- 本地访问: http://localhost

### 专用域名部署 (ky11181014.example.com)

如果您想使用专用的免费域名 `ky11181014.example.com`，请使用专门的部署脚本：

```bash
# 快速部署到 ky11181014.example.com
chmod +x quick-start-ky11181014.sh
./quick-start-ky11181014.sh

# 或者使用完整部署脚本
chmod +x deploy-ky11181014.sh
./deploy-ky11181014.sh
```

详细说明请查看：[KY11181014_DEPLOYMENT.md](old/KY11181014_DEPLOYMENT.md)

## 📁 项目结构

```
.
├── main.py              # FastAPI后端主程序
├── requirements.txt     # Python依赖
├── Dockerfile          # Docker镜像构建
├── docker-compose.yml  # Docker编排配置
├── nginx.conf          # Nginx反向代理配置
├── deploy.sh           # 一键部署脚本
├── init.sql            # 数据库初始化脚本
├── .env.example        # 环境变量示例
├── static/             # 前端静态文件
│   ├── index.html      # 主页面
│   ├── style.css       # 样式文件
│   └── script.js       # JavaScript逻辑
└── README.md           # 项目说明
```

## 🛠️ 管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看应用日志
docker-compose logs -f app

# 查看Nginx日志
docker-compose logs -f nginx

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新应用
git pull origin main
./deploy.sh
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| MYSQL_HOST | 数据库主机 | 11.142.154.110 |
| MYSQL_PORT | 数据库端口 | 3306 |
| MYSQL_DATABASE | 数据库名称 | yx4r9mfd |
| MYSQL_USERNAME | 数据库用户名 | with_ldfqjviwndxficmc |
| MYSQL_PASSWORD | 数据库密码 | !!ZawucJTf8B0x |
| ENVIRONMENT | 运行环境 | production |
| DOMAIN | 域名配置 | ky11181014.com |

### 域名配置

确保域名DNS记录指向服务器IP地址：
- A记录: ky11181014.com → 服务器IP
- A记录: www.ky11181014.com → 服务器IP

## 📊 API接口

### 记录管理
- `GET /api/records` - 获取所有记录
- `POST /api/records` - 创建新记录
- `PUT /api/records/{id}` - 更新记录
- `DELETE /api/records/{id}` - 删除记录

### 系统接口
- `GET /health` - 健康检查
- `GET /static/` - 静态文件服务

## 🎨 界面预览

应用采用现代化设计风格：
- 温馨的粉色主题色调
- 卡片式记录展示
- 响应式布局设计
- 流畅的交互动画

## 🔒 安全特性

- CORS跨域保护
- SQL注入防护
- XSS攻击防护
- 安全HTTP头配置

## 📝 更新日志

### v1.0.0 (2025-08-26)
- 初始版本发布
- 基础记录管理功能
- 响应式界面设计
- Docker容器化部署

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

## 📄 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 💖 致谢

感谢所有为这个项目贡献的朋友们，让爱情记录变得更加美好！

---

**用爱记录每一个美好时刻 💕**