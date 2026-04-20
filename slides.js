const pptxgen = require("pptxgenjs");
const { warnIfSlideHasOverlaps, warnIfSlideElementsOutOfBounds } = require('./pptxgenjs_helpers/layout');

// Create a new PowerPoint presentation
const pptx = new pptxgen();

// Slide 1: Title Slide
let slide = pptx.addSlide();
slide.addText("事项提示器（NotMatters）", {
    x: 0.5, y: 1.5, w: 9, h: 1.2,
    fontSize: 32,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText("基于Django的任务管理和提醒系统", {
    x: 0.5, y: 3.0, w: 9, h: 0.8,
    fontSize: 18,
    align: "center",
    color: "548DD4"
});
slide.addText("版本: 1.0.0 | 2026-04", {
    x: 0.5, y: 4.5, w: 9, h: 0.5,
    fontSize: 11,
    align: "center",
    color: "888888"
});

// Slide 2: Project Overview & Tech Stack
slide = pptx.addSlide();
slide.addText("项目概述 & 技术栈", {
    x: 0.5, y: 0.3, w: 9, h: 0.8,
    fontSize: 22,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "项目介绍\n", bold: true, fontSize: 14 },
    { text: "事项提示器是一个基于Django的任务管理和提醒系统，提供实时提醒、任务管理、统计分析等功能，帮助用户提高工作效率。", fontSize: 11 }
], {
    x: 0.5, y: 1.2, w: 9, h: 1.2,
    fontSize: 11
});
slide.addText("技术栈", {
    x: 0.5, y: 2.5, w: 9, h: 0.5,
    fontSize: 16,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "前端: HTML5, CSS3, Bootstrap 5, Chart.js, WebSocket\n" },
    { text: "后端: Django 5.2.3, Python 3.11+, Django Channels, Daphne\n" },
    { text: "数据库: MySQL | 认证: JWT" }
], {
    x: 0.8, y: 3.1, w: 8.4, h: 1.5,
    fontSize: 11
});

// Slide 3: Core Features
slide = pptx.addSlide();
slide.addText("核心功能", {
    x: 0.5, y: 0.3, w: 9, h: 0.8,
    fontSize: 22,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "1. 用户管理\n", bold: true, fontSize: 13 },
    { text: "   注册登录、JWT认证、头像上传、账户切换\n" },
    { text: "2. 任务管理\n", bold: true, fontSize: 13 },
    { text: "   创建编辑删除、优先级/状态/标签管理、进度节点\n" },
    { text: "3. 提醒系统\n", bold: true, fontSize: 13 },
    { text: "   WebSocket实时提醒、多种周期、音效设置、邮件提醒\n" },
    { text: "4. 统计分析 & 数据导出\n", bold: true, fontSize: 13 },
    { text: "   任务统计、Chart.js可视化、CSV/JSON/Excel导出\n" },
    { text: "5. 个性化设置\n", bold: true, fontSize: 13 },
    { text: "   主题/语言切换、音量/响铃时长、日期时间设置" }
], {
    x: 0.5, y: 1.2, w: 9, h: 4.0,
    fontSize: 11,
    lineSpacing: 1.3
});

// Slide 4: Database Design & Project Structure
slide = pptx.addSlide();
slide.addText("数据库设计 & 项目结构", {
    x: 0.5, y: 0.3, w: 9, h: 0.8,
    fontSize: 22,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText("数据库模型", {
    x: 0.5, y: 1.2, w: 4.5, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• User: Django内置用户模型\n" },
    { text: "• UserProfile: 头像、提醒音效\n" },
    { text: "• Task: 标题、描述、优先级、截止时间、状态、提醒时间、提醒周期、标签" }
], {
    x: 0.8, y: 1.8, w: 4.2, h: 2.0,
    fontSize: 10
});
slide.addText("项目结构", {
    x: 5.0, y: 1.2, w: 4.5, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "NotMatters/\n" },
    { text: "├── NotMatters/ (配置)\n" },
    { text: "├── task_reminder/ (应用)\n" },
    { text: "├── templates/ (模板)\n" },
    { text: "├── static/ (静态文件)\n" },
    { text: "├── manage.py" }
], {
    x: 5.3, y: 1.8, w: 4.2, h: 2.0,
    fontSize: 10
});

// Slide 5: Installation & Usage
slide = pptx.addSlide();
slide.addText("安装部署 & 使用指南", {
    x: 0.5, y: 0.3, w: 9, h: 0.8,
    fontSize: 22,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText("安装部署", {
    x: 0.5, y: 1.2, w: 9, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "1. Python 3.11+, MySQL 5.7+\n" },
    { text: "2. 克隆项目，安装依赖: pip install -r requirements.txt\n" },
    { text: "3. 配置数据库，执行迁移: python manage.py migrate\n" },
    { text: "4. 运行: daphne NotMatters.asgi:application (支持WebSocket)\n" },
    { text: "5. 访问 http://localhost:8000/" }
], {
    x: 0.8, y: 1.8, w: 8.4, h: 1.5,
    fontSize: 11
});
slide.addText("使用步骤", {
    x: 0.5, y: 3.4, w: 9, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "注册登录 → 添加任务 → 设置提醒 → 查看统计 → 个性化设置" }
], {
    x: 0.8, y: 4.0, w: 8.4, h: 1.0,
    fontSize: 11
});

// Slide 6: Admin & Technical Features
slide = pptx.addSlide();
slide.addText("管理员功能 & 技术特点", {
    x: 0.5, y: 0.3, w: 9, h: 0.8,
    fontSize: 22,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText("管理员功能", {
    x: 0.5, y: 1.2, w: 4.5, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• 超级用户登录\n" },
    { text: "• 查看总用户数\n" },
    { text: "• 系统任务完成率\n" },
    { text: "• 用户任务分布\n" },
    { text: "• 任务完成趋势" }
], {
    x: 0.8, y: 1.8, w: 4.2, h: 1.5,
    fontSize: 11
});
slide.addText("技术特点", {
    x: 5.0, y: 1.2, w: 4.5, h: 0.5,
    fontSize: 14,
    bold: true,
    color: "548DD4"
});
slide.addText([
    { text: "• WebSocket实时提醒\n" },
    { text: "• 响应式设计\n" },
    { text: "• 国际化支持\n" },
    { text: "• 数据可视化\n" },
    { text: "• JWT安全认证\n" },
    { text: "• 模块化设计" }
], {
    x: 5.3, y: 1.8, w: 4.2, h: 1.8,
    fontSize: 11
});

// Slide 7: Conclusion
slide = pptx.addSlide();
slide.addText("项目总结", {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 22,
    bold: true,
    align: "center",
    color: "366092"
});
slide.addText([
    { text: "事项提示器（NotMatters）是一个功能完整的任务管理和提醒系统，具有以下优势：\n", fontSize: 13, bold: true },
    { text: "• 实时提醒，确保任务不会被遗忘\n" },
    { text: "• 全面的任务管理功能\n" },
    { text: "• 丰富的统计分析和数据导出\n" },
    { text: "• 个性化设置，良好用户体验\n" },
    { text: "• 响应式设计，适配不同设备\n" },
    { text: "• 国际化支持，中英文切换\n" },
    { text: "\n项目采用模块化设计，易于扩展和维护，是理想的任务管理解决方案。", fontSize: 11 }
], {
    x: 0.8, y: 1.4, w: 8.4, h: 3.8,
    fontSize: 11,
    lineSpacing: 1.3
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
