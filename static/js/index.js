// 日历功能
document.addEventListener('DOMContentLoaded', function() {
    // 从DOM中获取数据
    const calendarElement = document.getElementById('calendar');
    const todayDate = calendarElement.getAttribute('data-today');
    const taskCountsData = calendarElement.getAttribute('data-task-counts');
    
    // 解析今日日期字符串为年、月、日
    const todayParts = todayDate.split('-');
    const todayYear = parseInt(todayParts[0], 10);
    const todayMonth = parseInt(todayParts[1], 10);
    const todayDay = parseInt(todayParts[2], 10);
    
    let taskCounts = {};
    try {
        taskCounts = taskCountsData ? JSON.parse(taskCountsData) : {};
    } catch (error) {
        console.error('Error parsing task counts:', error);
        taskCounts = {};
    }
    
    // 获取当前月份的第一天
    const firstDay = new Date(todayYear, todayMonth - 1, 1);
    // 获取当前月份的最后一天
    const lastDay = new Date(todayYear, todayMonth, 0);
    // 获取第一天是星期几
    const firstDayOfWeek = firstDay.getDay();
    // 获取月份名称
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    const calendar = document.getElementById('calendar');
    
    // 创建日历头部
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center mb-3';
    header.innerHTML = `
        <h4 class="h6 mb-0">${todayYear}年 ${monthNames[todayMonth - 1]}</h4>
    `;
    calendar.appendChild(header);
    
    // 创建星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekHeader = document.createElement('div');
    weekHeader.className = 'd-flex mb-2';
    weekDays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'col text-center font-weight-bold';
        dayElement.textContent = day;
        weekHeader.appendChild(dayElement);
    });
    calendar.appendChild(weekHeader);
    
    // 创建日历网格
    const grid = document.createElement('div');
    grid.className = 'd-grid grid-cols-7 gap-1';
    
    // 添加上个月的日期
    for (let i = 0; i < firstDayOfWeek; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'text-center p-2 text-muted';
        grid.appendChild(dayElement);
    }
    
    // 添加当前月份的日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
        // 构建日期字符串（与后端保持一致）
        const year = todayYear;
        const month = String(todayMonth).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateString = year + '-' + month + '-' + dayStr;
        
        // 创建日期容器
        const dayElement = document.createElement('div');
        dayElement.className = 'text-center p-1';
        
        // 创建日期按钮
        const dateButton = document.createElement('div');
        dateButton.className = 'd-inline-flex align-items-center justify-content-center w-10 h-10';
        dateButton.textContent = day;
        dateButton.style.fontSize = '1.1rem';
        
        // 检查是否是今天
        const isToday = day === todayDay;
        if (isToday) {
            dateButton.classList.add('bg-primary', 'text-white', 'rounded-circle');
        }
        
        // 检查是否有任务
        const hasTasks = taskCounts[dateString];
        if (hasTasks) {
            // 如果不是今天，添加任务标记样式
            if (!isToday) {
                dateButton.classList.add('bg-secondary', 'text-white', 'rounded-circle');
            }
            
            // 添加点击事件
            dateButton.style.cursor = 'pointer';
            dateButton.addEventListener('click', function() {
                handleDateClick(dateString);
            });
        }
        
        dayElement.appendChild(dateButton);
        grid.appendChild(dayElement);
    }
    
    calendar.appendChild(grid);
    
    // 处理日期点击事件
    function handleDateClick(dateString) {
        fetch('/tasks/get-tasks-by-date/?date=' + dateString)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.success && data.tasks) {
                    if (data.tasks.length === 1) {
                        // 只有一个任务，跳转到任务详情页
                        window.location.href = '/tasks/detail/' + data.tasks[0].id + '/';
                    } else if (data.tasks.length > 1) {
                        // 多个任务，跳转到任务列表页并筛选
                        window.location.href = '/task_list/?date=' + dateString;
                    }
                }
            })
            .catch(function(error) {
                console.error('Error fetching tasks by date:', error);
                // 发生错误时，默认跳转到任务列表页并筛选
                window.location.href = '/task_list/?date=' + dateString;
            });
    }
});