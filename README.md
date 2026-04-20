# 事项提示器（NotMatters）项目文档

## 项目概述

事项提示器是一个基于Django的任务管理和提醒系统，提供实时提醒、任务管理、统计分析等功能。系统支持多用户、实时提醒、数据统计和导出等功能，旨在帮助用户更好地管理和跟踪任务。

## 技术栈

### 前端
- HTML5 + CSS3 + JavaScript
- Bootstrap 5
- Chart.js（数据可视化）
- WebSocket（实时提醒）

### 后端
- Django 5.2.3
- Python 3.11+
- Django Channels（WebSocket支持）
- Daphne（ASGI服务器）
- MySQL（数据库）
- JWT（认证）

### 其他
- Pillow（图像处理）
- WhiteNoise（静态文件处理）
- Graphviz（生成ER关系图）

## 项目结构

```
NotMatters/
├── NotMatters/            # 项目配置目录
│   ├── __init__.py
│   ├── asgi.py           # ASGI配置（WebSocket支持）
│   ├── settings.py       # 项目设置
│   ├── urls.py           # 主URL配置
│   └── wsgi.py           # WSGI配置
├── task_reminder/        # 任务提醒应用
│   ├── __init__.py
│   ├── admin.py          # 管理员配置
│   ├── apps.py           # 应用配置
│   ├── consumers.py      # WebSocket消费者
│   ├── forms.py          # 表单定义
│   ├── models.py         # 数据模型
│   ├── routing.py        # WebSocket路由
│   ├── urls.py           # 应用URL配置
│   └── views.py          # 视图函数
├── templates/            # 模板文件
│   ├── base.html         # 基础模板
│   ├── index.html        # 首页
│   ├── login.html        # 登录页
│   ├── register.html     # 注册页
│   ├── set.html          # 设置页
│   ├── switch_account.html  # 切换账户页
│   └── task_reminder/    # 任务提醒相关模板
├── static/               # 静态文件
│   ├── bootstrap5/       # Bootstrap文件
│   ├── css/              # 自定义CSS
│   ├── images/           # 图片
│   ├── js/               # JavaScript文件
│   ├── locales/          # 国际化文件
│   └── videos/           # 视频和音频文件
├── media/                # 媒体文件（用户上传）
├── migrations/           # 数据库迁移文件
├── generate_er_diagram.py  # 生成ER关系图
├── manage.py             # 项目管理脚本
├── my.cnf                # 数据库配置
├── package.json          # npm配置
└── requirements.txt      # Python依赖
```

## 核心功能

### 1. 用户管理
- 用户注册、登录
- JWT认证
- 用户头像上传
- 账户切换

### 2. 任务管理
- 创建、编辑、删除任务
- 任务优先级设置（高、中、低）
- 任务状态管理（待办、进行中、已完成）
- 任务标签
- 任务进度节点

### 3. 提醒系统
- 实时提醒（WebSocket）
- 多种提醒周期（一次性、每天、每周、每月、每年、自定义）
- 提醒音效设置
- 邮件提醒（显示在浏览器控制台）

### 4. 统计分析
- 任务完成率
- 任务状态分布
- 任务优先级分布
- 任务创建趋势
- 标签分布
- 每日任务完成数
- 管理员统计（总用户数、平均完成率）

### 5. 数据导出
- CSV格式
- JSON格式
- Excel格式

### 6. 个性化设置
- 主题切换（浅色/深色）
- 语言切换（中文/英文）
- 音量设置
- 响铃时长设置
- 日期时间设置（时区、日期格式、时间格式）

## 数据库设计

### 主要模型

1. **User**（Django内置）
   - id: 主键
   - username: 用户名
   - password: 密码
   - email: 邮箱
   - first_name: 名
   - last_name: 姓

2. **UserProfile**
   - id: 主键
   - user: 外键（User）
   - avatar: 头像
   - reminder_sound: 提醒音效

3. **UserSession**
   - id: 主键
   - user: 外键（User）
   - token: 会话令牌
   - device_info: 设备信息
   - created_at: 创建时间
   - last_activity: 最后活动时间
   - is_active: 是否活跃

4. **Task**
   - id: 主键
   - user: 外键（User）
   - title: 标题
   - description: 描述
   - priority: 优先级
   - created_at: 创建时间
   - due_date: 截止时间
   - status: 状态
   - reminder_time: 提醒时间
   - reminder_period: 提醒周期
   - custom_reminder_days: 自定义提醒天数
   - is_reminded: 是否已提醒
   - tags: 标签
   - progress_nodes: 进度节点

## 安装部署

### 1. 环境要求
- Python 3.11+
- MySQL 5.7+
- pip

### 2. 安装步骤

#### 2.1 克隆项目
```bash
git clone <项目地址>
cd NotMatters
```

#### 2.2 安装依赖
```bash
pip install -r requirements.txt
```

#### 2.3 配置数据库
- 确保MySQL服务正在运行
- 修改 `my.cnf` 文件中的数据库连接信息

#### 2.4 数据库迁移
```bash
python manage.py migrate
```

#### 2.5 收集静态文件
```bash
python manage.py collectstatic
```

#### 2.6 创建超级用户
```bash
python manage.py createsuperuser
```

### 3. 运行项目

#### 3.1 开发模式（支持WebSocket）
```bash
python -m daphne -b 127.0.0.1 -p 8000 NotMatters.asgi:application
```

#### 3.2 开发模式（不支持WebSocket）
```bash
python manage.py runserver 8000
```

### 4. 访问项目
打开浏览器访问：http://localhost:8000/

## 使用指南

### 1. 注册登录
- 访问首页点击「注册」按钮
- 填写注册信息并提交
- 使用注册的账号登录

### 2. 任务管理
- 登录后，点击「添加任务」按钮创建任务
- 在任务列表中点击任务查看详情
- 点击「编辑」按钮修改任务
- 点击「删除」按钮删除任务

### 3. 提醒设置
- 在创建或编辑任务时设置提醒时间和周期
- 在「设置」页面上传自定义提醒音效
- 任务到期时会收到实时提醒

### 4. 统计分析
- 点击导航栏的「统计」查看个人统计
- 超级管理员可以查看系统统计
- 可以导出统计数据为CSV、JSON或Excel格式

### 5. 个性化设置
- 点击导航栏的「设置」进入设置页面
- 可以切换主题、语言、调整音量等
- 可以设置日期时间格式和时区

## 管理员功能

### 1. 超级管理员登录
- 使用创建的超级用户账号登录
- 登录后会看到「超级管理员面板」选项

### 2. 系统统计
- 查看总用户数
- 查看系统任务完成率
- 查看用户任务分布
- 查看任务完成趋势

### 3. 用户管理
- 通过Django admin管理用户
- 访问：http://localhost:8000/admin/

## 技术特点

1. **实时提醒**：使用WebSocket实现实时提醒，无延迟
2. **响应式设计**：适配不同设备屏幕
3. **国际化支持**：支持中英文切换
4. **数据可视化**：使用Chart.js展示统计数据
5. **安全性**：使用JWT认证，密码加密存储
6. **可扩展性**：模块化设计，易于添加新功能

## 常见问题

### 1. 提醒不工作
- 检查浏览器是否支持WebSocket
- 确保Daphne服务器正在运行
- 检查任务的提醒时间设置

### 2. 静态文件加载失败
- 运行 `python manage.py collectstatic`
- 确保WhiteNoise配置正确

### 3. 数据库连接失败
- 检查MySQL服务是否运行
- 检查 `my.cnf` 中的连接信息

### 4. 头像上传失败
- 检查media目录权限
- 确保Pillow已安装

## 开发与扩展

### 1. 添加新功能
- 在 `task_reminder/views.py` 中添加新视图
- 在 `task_reminder/urls.py` 中添加新URL
- 在 `templates/task_reminder/` 中添加新模板

### 2. 数据库模型扩展
- 在 `task_reminder/models.py` 中修改模型
- 运行 `python manage.py makemigrations` 创建迁移
- 运行 `python manage.py migrate` 应用迁移

### 3. 前端开发
- 静态文件位于 `static/` 目录
- JavaScript文件位于 `static/js/` 目录
- CSS文件位于 `static/css/` 目录

## 项目维护

### 1. 日志管理
- Django日志位于项目根目录
- 检查日志文件排查问题

### 2. 性能优化
- 使用数据库索引
- 优化查询语句
- 缓存静态文件

### 3. 安全更新
- 定期更新依赖包
- 检查安全漏洞
- 保持Django版本最新

## 许可证

本项目采用MIT许可证。

## 联系方式

如有问题或建议，请联系项目维护者。

---

**项目版本：** 1.0.0
**最后更新：** 2026-04-13