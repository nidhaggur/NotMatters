const pptxgen = require("pptxgenjs");
const { warnIfSlideHasOverlaps, warnIfSlideElementsOutOfBounds } = require('./pptxgenjs_helpers/layout');

// Create a new PowerPoint presentation
const pptx = new pptxgen();

// Slide 1: Title Slide
let slide = pptx.addSlide();
slide.addText("事项提示器（NotMatters）", {
    x: 0.5, y: 1.2, w: 9, h: 1.3,
    fontSize: 36,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText("基于Django的任务管理和提醒系统", {
    x: 0.5, y: 2.8, w: 9, h: 0.9,
    fontSize: 20,
    align: "center",
    color: "548DD4"
});
slide.addText("版本: 1.0.0 | 最后更新: 2026-04-13", {
    x: 0.5, y: 4.5, w: 9, h: 0.7,
    fontSize: 12,
    align: "center",
    color: "888888"
});

// Slide 2: Project Overview
slide = pptx.addSlide();
slide.addText("项目概述", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "事项提示器是一个基于Django的任务管理和提醒系统，提供：\n", bold: true, fontSize: 14 },
    { text: "• 实时提醒功能\n" },
    { text: "• 任务管理\n" },
    { text: "• 统计分析\n" },
    { text: "• 多用户支持\n" },
    { text: "• 数据导出\n" },
    { text: "• 个性化设置\n" },
    { text: "\n系统旨在帮助用户更好地管理和跟踪任务，提高工作效率。", fontSize: 12 }
], {
    x: 0.8, y: 1.5, w: 8.4, h: 3.8,
    fontSize: 12,
    lineSpacing: 1.2
});

// Slide 3: Technology Stack
slide = pptx.addSlide();
slide.addText("技术栈", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});

// Frontend section
slide.addText("前端", {
    x: 0.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 18,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• HTML5 + CSS3 + JavaScript\n" },
    { text: "• Bootstrap 5\n" },
    { text: "• Chart.js（数据可视化）\n" },
    { text: "• WebSocket（实时提醒）\n" }
], {
    x: 0.8, y: 2.1, w: 3.8, h: 2.6,
    fontSize: 12
});

// Backend section
slide.addText("后端", {
    x: 5.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 18,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• Django 5.2.3\n" },
    { text: "• Python 3.11+\n" },
    { text: "• Django Channels（WebSocket）\n" },
    { text: "• Daphne（ASGI服务器）\n" },
    { text: "• MySQL（数据库）\n" },
    { text: "• JWT（认证）\n" }
], {
    x: 5.8, y: 2.1, w: 3.8, h: 2.6,
    fontSize: 12
});

// Slide 4: Project Structure
slide = pptx.addSlide();
slide.addText("项目结构", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "NotMatters/\n", bold: true },
    { text: "├── NotMatters/            # 项目配置目录\n" },
    { text: "├── task_reminder/        # 任务提醒应用\n" },
    { text: "├── templates/            # 模板文件\n" },
    { text: "├── static/               # 静态文件\n" },
    { text: "├── media/                # 媒体文件\n" },
    { text: "├── migrations/           # 数据库迁移文件\n" },
    { text: "├── manage.py             # 项目管理脚本\n" },
    { text: "└── requirements.txt      # Python依赖\n" }
], {
    x: 0.8, y: 1.5, w: 8.4, h: 3.8,
    fontSize: 11,
    lineSpacing: 1.1
});

// Slide 5: Core Features - User Management
slide = pptx.addSlide();
slide.addText("核心功能 - 用户管理", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "• 用户注册、登录\n" },
    { text: "• JWT认证\n" },
    { text: "• 用户头像上传\n" },
    { text: "• 账户切换\n" }
], {
    x: 1.5, y: 1.5, w: 7, h: 3.8,
    fontSize: 14
});

// Slide 6: Core Features - Task Management
slide = pptx.addSlide();
slide.addText("核心功能 - 任务管理", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "• 创建、编辑、删除任务\n" },
    { text: "• 任务优先级设置（高、中、低）\n" },
    { text: "• 任务状态管理（待办、进行中、已完成）\n" },
    { text: "• 任务标签\n" },
    { text: "• 任务进度节点\n" }
], {
    x: 1.5, y: 1.5, w: 7, h: 3.8,
    fontSize: 14
});

// Slide 7: Core Features - Reminder System
slide = pptx.addSlide();
slide.addText("核心功能 - 提醒系统", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "• 实时提醒（WebSocket）\n" },
    { text: "• 多种提醒周期（一次性、每天、每周、每月、每年、自定义）\n" },
    { text: "• 提醒音效设置\n" },
    { text: "• 邮件提醒（显示在浏览器控制台）\n" }
], {
    x: 1.5, y: 1.5, w: 7, h: 3.8,
    fontSize: 14
});

// Slide 8: Core Features - Statistics & Export
slide = pptx.addSlide();
slide.addText("核心功能 - 统计分析 & 数据导出", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});

// Statistics section
slide.addText("统计分析", {
    x: 0.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 16,
    bold: true
});
slide.addText([
    { text: "• 任务完成率\n" },
    { text: "• 任务状态分布\n" },
    { text: "• 任务优先级分布\n" },
    { text: "• 任务创建趋势\n" },
    { text: "• 标签分布\n" },
    { text: "• 每日任务完成数\n" },
    { text: "• 管理员统计\n" }
], {
    x: 0.8, y: 2.1, w: 3.8, h: 3.2,
    fontSize: 12
});

// Export section
slide.addText("数据导出", {
    x: 5.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 16,
    bold: true
});
slide.addText([
    { text: "• CSV格式\n" },
    { text: "• JSON格式\n" },
    { text: "• Excel格式\n" }
], {
    x: 5.8, y: 2.1, w: 3.8, h: 2.8,
    fontSize: 12
});

// Slide 9: Core Features - Personalization
slide = pptx.addSlide();
slide.addText("核心功能 - 个性化设置", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "• 主题切换（浅色/深色）\n" },
    { text: "• 语言切换（中文/英文）\n" },
    { text: "• 音量设置\n" },
    { text: "• 响铃时长设置\n" },
    { text: "• 日期时间设置（时区、日期格式、时间格式）\n" }
], {
    x: 1.5, y: 1.5, w: 7, h: 3.8,
    fontSize: 14
});

// Slide 10: Database Design
slide = pptx.addSlide();
slide.addText("数据库设计", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});

// User model
slide.addText("1. User（Django内置）", {
    x: 0.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• id: 主键\n" },
    { text: "• username: 用户名\n" },
    { text: "• password: 密码\n" },
    { text: "• email: 邮箱\n" },
    { text: "• first_name: 名\n" },
    { text: "• last_name: 姓\n" }
], {
    x: 0.8, y: 2.1, w: 3.8, h: 2.2,
    fontSize: 11
});

// UserProfile model
slide.addText("2. UserProfile", {
    x: 5.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• id: 主键\n" },
    { text: "• user: 外键（User）\n" },
    { text: "• avatar: 头像\n" },
    { text: "• reminder_sound: 提醒音效\n" }
], {
    x: 5.8, y: 2.1, w: 3.8, h: 1.8,
    fontSize: 11
});

// Task model
slide.addText("3. Task", {
    x: 0.5, y: 4.0, w: 9, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• id: 主键 | user: 外键（User）\n" },
    { text: "• title: 标题 | description: 描述\n" },
    { text: "• priority: 优先级 | due_date: 截止时间\n" },
    { text: "• status: 状态 | reminder_time: 提醒时间\n" },
    { text: "• reminder_period: 提醒周期 | tags: 标签\n" }
], {
    x: 0.8, y: 4.6, w: 8.4, h: 1.2,
    fontSize: 11
});

// Slide 11: Installation & Deployment
slide = pptx.addSlide();
slide.addText("安装部署", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});

// Environment requirements
slide.addText("1. 环境要求", {
    x: 0.5, y: 1.5, w: 9, h: 0.5,
    fontSize: 16,
    bold: true
});
slide.addText([
    { text: "• Python 3.11+\n" },
    { text: "• MySQL 5.7+\n" },
    { text: "• pip\n" }
], {
    x: 1.5, y: 2.1, w: 7, h: 1.3,
    fontSize: 14
});

// Installation steps
slide.addText("2. 安装步骤", {
    x: 0.5, y: 3.6, w: 9, h: 0.5,
    fontSize: 16,
    bold: true
});
slide.addText([
    { text: "• 克隆项目：git clone <项目地址>\n" },
    { text: "• 安装依赖：pip install -r requirements.txt\n" },
    { text: "• 配置数据库：修改 my.cnf 文件\n" },
    { text: "• 数据库迁移：python manage.py migrate\n" },
    { text: "• 收集静态文件：python manage.py collectstatic\n" },
    { text: "• 创建超级用户：python manage.py createsuperuser\n" }
], {
    x: 0.8, y: 4.2, w: 8.4, h: 1.5,
    fontSize: 12
});

// Slide 12: Running the Project
slide = pptx.addSlide();
slide.addText("运行项目", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});

// Development modes
slide.addText("1. 开发模式（支持WebSocket）", {
    x: 0.5, y: 1.5, w: 9, h: 0.5,
    fontSize: 16,
    bold: true
});
slide.addText("python -m daphne -b 127.0.0.1 -p 8000 NotMatters.asgi:application", {
    x: 0.8, y: 2.1, w: 8.4, h: 0.7,
    fontSize: 12,
    color: "0066CC"
});

slide.addText("2. 开发模式（不支持WebSocket）", {
    x: 0.5, y: 3.0, w: 9, h: 0.5,
    fontSize: 16,
    bold: true
});
slide.addText("python manage.py runserver 8000", {
    x: 0.8, y: 3.6, w: 8.4, h: 0.7,
    fontSize: 12,
    color: "0066CC"
});

slide.addText("3. 访问项目", {
    x: 0.5, y: 4.5, w: 9, h: 0.5,
    fontSize: 16,
    bold: true
});
slide.addText("打开浏览器访问：http://localhost:8000/", {
    x: 0.8, y: 5.1, w: 8.4, h: 0.7,
    fontSize: 12,
    color: "0066CC"
});

// Slide 13: Usage Guide
slide = pptx.addSlide();
slide.addText("使用指南", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});

// Registration & Login
slide.addText("1. 注册登录", {
    x: 0.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 访问首页点击「注册」按钮\n" },
    { text: "• 填写注册信息并提交\n" },
    { text: "• 使用注册的账号登录\n" }
], {
    x: 0.8, y: 2.1, w: 3.8, h: 1.5,
    fontSize: 12
});

// Task Management
slide.addText("2. 任务管理", {
    x: 5.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 点击「添加任务」按钮创建任务\n" },
    { text: "• 点击任务查看详情\n" },
    { text: "• 点击「编辑」按钮修改任务\n" },
    { text: "• 点击「删除」按钮删除任务\n" }
], {
    x: 5.8, y: 2.1, w: 3.8, h: 1.8,
    fontSize: 12
});

// Reminder Settings
slide.addText("3. 提醒设置", {
    x: 0.5, y: 3.9, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 设置提醒时间和周期\n" },
    { text: "• 上传自定义提醒音效\n" },
    { text: "• 任务到期时会收到实时提醒\n" }
], {
    x: 0.8, y: 4.5, w: 3.8, h: 1.5,
    fontSize: 12
});

// Statistics & Settings
slide.addText("4. 统计与设置", {
    x: 5.5, y: 3.9, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 点击「统计」查看个人统计\n" },
    { text: "• 点击「设置」进入设置页面\n" },
    { text: "• 切换主题、语言、调整音量等\n" }
], {
    x: 5.8, y: 4.5, w: 3.8, h: 1.5,
    fontSize: 12
});

// Slide 14: Admin Features
slide = pptx.addSlide();
slide.addText("管理员功能", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});

// Admin Login
slide.addText("1. 超级管理员登录", {
    x: 0.5, y: 1.5, w: 9, h: 0.5,
    fontSize: 16,
    bold: true
});
slide.addText([
    { text: "• 使用创建的超级用户账号登录\n" },
    { text: "• 登录后会看到「超级管理员面板」选项\n" }
], {
    x: 1.5, y: 2.1, w: 7, h: 1.3,
    fontSize: 14
});

// System Statistics
slide.addText("2. 系统统计", {
    x: 0.5, y: 3.6, w: 9, h: 0.5,
    fontSize: 16,
    bold: true
});
slide.addText([
    { text: "• 查看总用户数\n" },
    { text: "• 查看系统任务完成率\n" },
    { text: "• 查看用户任务分布\n" },
    { text: "• 查看任务完成趋势\n" }
], {
    x: 0.8, y: 4.2, w: 8.4, h: 1.8,
    fontSize: 14
});

// Slide 15: Technical Features
slide = pptx.addSlide();
slide.addText("技术特点", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "1. 实时提醒：使用WebSocket实现实时提醒，无延迟\n" },
    { text: "2. 响应式设计：适配不同设备屏幕\n" },
    { text: "3. 国际化支持：支持中英文切换\n" },
    { text: "4. 数据可视化：使用Chart.js展示统计数据\n" },
    { text: "5. 安全性：使用JWT认证，密码加密存储\n" },
    { text: "6. 可扩展性：模块化设计，易于添加新功能\n" }
], {
    x: 1.5, y: 1.5, w: 7, h: 3.8,
    fontSize: 12,
    lineSpacing: 1.3
});

// Slide 16: Common Issues
slide = pptx.addSlide();
slide.addText("常见问题", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});

// Issue 1
slide.addText("1. 提醒不工作", {
    x: 0.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 检查浏览器是否支持WebSocket\n" },
    { text: "• 确保Daphne服务器正在运行\n" },
    { text: "• 检查任务的提醒时间设置\n" }
], {
    x: 0.8, y: 2.1, w: 3.8, h: 1.5,
    fontSize: 12
});

// Issue 2
slide.addText("2. 静态文件加载失败", {
    x: 5.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 运行 python manage.py collectstatic\n" },
    { text: "• 确保WhiteNoise配置正确\n" }
], {
    x: 5.8, y: 2.1, w: 3.8, h: 1.3,
    fontSize: 12
});

// Issue 3
slide.addText("3. 数据库连接失败", {
    x: 0.5, y: 3.9, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 检查MySQL服务是否运行\n" },
    { text: "• 检查 my.cnf 中的连接信息\n" }
], {
    x: 0.8, y: 4.5, w: 3.8, h: 1.3,
    fontSize: 12
});

// Issue 4
slide.addText("4. 头像上传失败", {
    x: 5.5, y: 3.9, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 检查media目录权限\n" },
    { text: "• 确保Pillow已安装\n" }
], {
    x: 5.8, y: 4.5, w: 3.8, h: 1.3,
    fontSize: 12
});

// Slide 17: Development & Extension
slide = pptx.addSlide();
slide.addText("开发与扩展", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});

// Adding New Features
slide.addText("1. 添加新功能", {
    x: 0.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 在 task_reminder/views.py 中添加新视图\n" },
    { text: "• 在 task_reminder/urls.py 中添加新URL\n" },
    { text: "• 在 templates/task_reminder/ 中添加新模板\n" }
], {
    x: 0.8, y: 2.1, w: 3.8, h: 1.8,
    fontSize: 12
});

// Database Model Extension
slide.addText("2. 数据库模型扩展", {
    x: 5.5, y: 1.5, w: 4, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 在 task_reminder/models.py 中修改模型\n" },
    { text: "• 运行 python manage.py makemigrations\n" },
    { text: "• 运行 python manage.py migrate\n" }
], {
    x: 5.8, y: 2.1, w: 3.8, h: 1.8,
    fontSize: 12
});

// Frontend Development
slide.addText("3. 前端开发", {
    x: 0.5, y: 4.1, w: 9, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 静态文件位于 static/ 目录\n" },
    { text: "• JavaScript文件位于 static/js/ 目录\n" },
    { text: "• CSS文件位于 static/css/ 目录\n" }
], {
    x: 0.8, y: 4.7, w: 8.4, h: 1.3,
    fontSize: 12
});

// Slide 18: Conclusion
slide = pptx.addSlide();
slide.addText("项目总结", {
    x: 0.5, y: 0.4, w: 9, h: 0.9,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "事项提示器（NotMatters）是一个功能完整的任务管理和提醒系统，具有以下优势：\n", fontSize: 14, bold: true },
    { text: "• 实时提醒功能，确保任务不会被遗忘\n" },
    { text: "• 全面的任务管理功能，满足各种需求\n" },
    { text: "• 丰富的统计分析，帮助用户了解任务完成情况\n" },
    { text: "• 个性化设置，提供良好的用户体验\n" },
    { text: "• 响应式设计，适配不同设备\n" },
    { text: "• 国际化支持，满足不同语言用户\n" },
    { text: "\n项目采用模块化设计，易于扩展和维护，是一个理想的任务管理解决方案。", fontSize: 12 }
], {
    x: 1, y: 1.5, w: 8, h: 3.8,
    fontSize: 12,
    lineSpacing: 1.2
});

// Validate slides
for (let i = 0; i < pptx.slides.length; i++) {
    const slide = pptx.slides[i];
    warnIfSlideHasOverlaps(slide, pptx);
    warnIfSlideElementsOutOfBounds(slide, pptx);
}

// Save the presentation
pptx.writeFile({ fileName: "NotMatters_Presentation.pptx" });
console.log("Presentation created successfully!");
