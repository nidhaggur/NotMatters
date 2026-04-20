// 获取当前时间并格式化为datetime-local输入所需的格式
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 根据提醒时间计算截止时间（提醒时间后十分钟）
function calculateDueDate(reminderTime) {
    if (!reminderTime) return '';
    const date = new Date(reminderTime);
    date.setMinutes(date.getMinutes() + 10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 为日期时间输入框添加滚轮支持
function addWheelSupportToDateTimeInputs() {
    // 为所有时间组件输入框添加滚轮支持
    const timeInputs = document.querySelectorAll('input[id$="_year"], input[id$="_month"], input[id$="_day"], input[id$="_hour"], input[id$="_minute"]');
    
    timeInputs.forEach(input => {
        input.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? -1 : 1; // 向上滚动增加，向下滚动减少
            const currentValue = parseInt(this.value) || 0;
            const min = parseInt(this.min) || 0;
            const max = parseInt(this.max) || 9999;
            
            // 计算新值
            let newValue = currentValue + delta;
            
            // 确保值在范围内
            if (newValue < min) newValue = min;
            if (newValue > max) newValue = max;
            
            // 更新输入框值
            this.value = newValue;
            
            // 更新对应的隐藏datetime输入框
            updateHiddenDateTimeInput(this);
        });
    });
}

// 获取日期时间输入框当前聚焦的部分
function getActiveDateTimePart(input) {
    // 尝试获取光标位置
    let selectionStart = 0;
    try {
        selectionStart = input.selectionStart;
    } catch (e) {
        // 如果无法获取光标位置，返回默认值
        return null;
    }
    
    // 格式: YYYY-MM-DDTHH:MM
    // 各部分的位置范围
    const parts = [
        { name: 'year', start: 0, end: 4 },
        { name: 'month', start: 5, end: 7 },
        { name: 'day', start: 8, end: 10 },
        { name: 'hour', start: 11, end: 13 },
        { name: 'minute', start: 14, end: 16 }
    ];
    
    // 查找当前光标位置所在的部分
    for (const part of parts) {
        if (selectionStart >= part.start && selectionStart <= part.end) {
            return part.name;
        }
    }
    
    return null;
}

// 格式化日期为datetime-local输入格式
function formatDateTimeForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 更新隐藏的datetime输入框
function updateHiddenDateTimeInput(input) {
    // 确定是截止时间还是提醒时间
    const isDueDate = input.id.startsWith('due_');
    const prefix = isDueDate ? 'due_' : 'reminder_';
    const hiddenInputId = isDueDate ? 'due_date' : 'reminder_time';
    
    // 获取所有相关的时间组件值
    const year = document.getElementById(prefix + 'year').value;
    const month = document.getElementById(prefix + 'month').value;
    const day = document.getElementById(prefix + 'day').value;
    const hour = document.getElementById(prefix + 'hour').value;
    const minute = document.getElementById(prefix + 'minute').value;
    
    // 获取隐藏输入框
    const hiddenInput = document.getElementById(hiddenInputId);
    if (hiddenInput) {
        if (year && month && day && hour && minute) {
            // 格式化为datetime-local格式
            const formattedDateTime = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            hiddenInput.value = formattedDateTime;
            // 确保隐藏输入框有name属性，这样会被提交
            hiddenInput.setAttribute('name', hiddenInputId);
        } else {
            // 如果任何一个时间组件为空，移除name属性，这样不会被提交
            hiddenInput.removeAttribute('name');
        }
    }
}

// 表单提交验证
document.addEventListener('DOMContentLoaded', function() {
    // 设置默认时间（仅添加任务页面）
    if (window.location.pathname.includes('/add/')) {
        // 检查是否已有值
        const reminderYear = document.getElementById('reminder_year');
        const dueYear = document.getElementById('due_year');
        
        // 如果没有设置时间
        if (!reminderYear.value || !dueYear.value) {
            const now = new Date();
            
            // 提醒时间：当前时间加1分钟
            const reminderDate = new Date(now);
            reminderDate.setMinutes(reminderDate.getMinutes() + 1);
            
            // 截止时间：提醒时间后10分钟
            const dueDate = new Date(reminderDate);
            dueDate.setMinutes(dueDate.getMinutes() + 10);
            
            // 设置提醒时间
            document.getElementById('reminder_year').value = reminderDate.getFullYear();
            document.getElementById('reminder_month').value = reminderDate.getMonth() + 1;
            document.getElementById('reminder_day').value = reminderDate.getDate();
            document.getElementById('reminder_hour').value = reminderDate.getHours();
            document.getElementById('reminder_minute').value = reminderDate.getMinutes();
            
            // 设置截止时间
            document.getElementById('due_year').value = dueDate.getFullYear();
            document.getElementById('due_month').value = dueDate.getMonth() + 1;
            document.getElementById('due_day').value = dueDate.getDate();
            document.getElementById('due_hour').value = dueDate.getHours();
            document.getElementById('due_minute').value = dueDate.getMinutes();
            
            // 更新隐藏输入框
            updateHiddenDateTimeInput(document.getElementById('reminder_year'));
            updateHiddenDateTimeInput(document.getElementById('due_year'));
        }
    } else if (window.location.pathname.includes('/edit/')) {
        // 编辑任务页面，初始化隐藏输入框
        // 检查提醒时间是否有值
        const reminderYear = document.getElementById('reminder_year');
        if (reminderYear && reminderYear.value) {
            updateHiddenDateTimeInput(reminderYear);
        }
        
        // 检查截止时间是否有值
        const dueYear = document.getElementById('due_year');
        if (dueYear && dueYear.value) {
            updateHiddenDateTimeInput(dueYear);
        }
    }
    
    // 为所有时间组件输入框添加输入事件监听器
    const timeInputs = document.querySelectorAll('input[id$="_year"], input[id$="_month"], input[id$="_day"], input[id$="_hour"], input[id$="_minute"]');
    timeInputs.forEach(input => {
        // 只有当用户实际输入时才更新隐藏输入框
        input.addEventListener('change', function() {
            updateHiddenDateTimeInput(this);
            
            // 如果修改的是提醒时间的组件，自动更新截止时间
            if (this.id.startsWith('reminder_')) {
                const reminderTimeInput = document.getElementById('reminder_time');
                const dueDateInput = document.getElementById('due_date');
                
                if (reminderTimeInput && dueDateInput && reminderTimeInput.value) {
                    // 计算截止时间为提醒时间后10分钟
                    dueDateInput.value = calculateDueDate(reminderTimeInput.value);
                    
                    // 同步到单独的输入框
                    const date = new Date(reminderTimeInput.value);
                    // 截止时间为提醒时间后10分钟
                    const dueDate = new Date(date);
                    dueDate.setMinutes(dueDate.getMinutes() + 10);
                    
                    document.getElementById('due_year').value = dueDate.getFullYear();
                    document.getElementById('due_month').value = dueDate.getMonth() + 1;
                    document.getElementById('due_day').value = dueDate.getDate();
                    document.getElementById('due_hour').value = dueDate.getHours();
                    document.getElementById('due_minute').value = dueDate.getMinutes();
                    
                    // 更新截止时间的隐藏输入框
                    updateHiddenDateTimeInput(document.getElementById('due_year'));
                }
            }
        });
    });
    
    // 当提醒时间变化时，自动更新截止时间
    const reminderTimeInput = document.getElementById('reminder_time');
    const dueDateInput = document.getElementById('due_date');
    
    if (reminderTimeInput && dueDateInput) {
        reminderTimeInput.addEventListener('change', function() {
            // 计算截止时间为提醒时间后10分钟
            dueDateInput.value = calculateDueDate(this.value);
            
            // 同步到单独的输入框
            if (this.value) {
                const date = new Date(this.value);
                // 截止时间为提醒时间后10分钟
                const dueDate = new Date(date);
                dueDate.setMinutes(dueDate.getMinutes() + 10);
                
                document.getElementById('due_year').value = dueDate.getFullYear();
                document.getElementById('due_month').value = dueDate.getMonth() + 1;
                document.getElementById('due_day').value = dueDate.getDate();
                document.getElementById('due_hour').value = dueDate.getHours();
                document.getElementById('due_minute').value = dueDate.getMinutes();
                
                // 更新截止时间的隐藏输入框
                updateHiddenDateTimeInput(document.getElementById('due_year'));
            }
        });
    }
    
    // 处理提醒周期选择
    const reminderPeriodSelect = document.getElementById('reminder_period');
    const customReminderDaysDiv = document.getElementById('custom-reminder-days');
    
    if (reminderPeriodSelect && customReminderDaysDiv) {
        // 初始检查
        updateCustomReminderDaysVisibility();
        
        // 当提醒周期变化时，显示或隐藏自定义提醒天数选项
        reminderPeriodSelect.addEventListener('change', updateCustomReminderDaysVisibility);
        
        function updateCustomReminderDaysVisibility() {
            if (reminderPeriodSelect.value === 'custom') {
                customReminderDaysDiv.style.display = 'block';
            } else {
                customReminderDaysDiv.style.display = 'none';
            }
        }
    }
    
    // 为日期时间输入框添加滚轮支持
    addWheelSupportToDateTimeInputs();
    
    // 表单提交处理
            const form = document.querySelector('form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    // 手动构建并更新隐藏的datetime输入框，确保值是最新的
                    function updateDateTimeInput(prefix, hiddenInputId) {
                        const year = document.getElementById(prefix + 'year').value;
                        const month = document.getElementById(prefix + 'month').value;
                        const day = document.getElementById(prefix + 'day').value;
                        const hour = document.getElementById(prefix + 'hour').value;
                        const minute = document.getElementById(prefix + 'minute').value;
                        
                        const hiddenInput = document.getElementById(hiddenInputId);
                        if (hiddenInput) {
                            // 检查是否有任何时间组件被修改过
                            const hasValue = year && month && day && hour && minute;
                            
                            if (hasValue) {
                                const formattedDateTime = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                                hiddenInput.value = formattedDateTime;
                                hiddenInput.setAttribute('name', hiddenInputId);
                            } else {
                                // 如果任何一个时间组件为空，移除name属性，这样不会被提交
                                hiddenInput.removeAttribute('name');
                            }
                        }
                    }
                    
                    // 检查是否是编辑任务页面
                    const isEditPage = window.location.pathname.includes('/edit/');
                    
                    if (isEditPage) {
                        // 在编辑任务页面，只在用户修改了时间字段时才提交时间参数
                        // 检查时间字段是否有值
                        const reminderYear = document.getElementById('reminder_year').value;
                        const reminderMonth = document.getElementById('reminder_month').value;
                        const reminderDay = document.getElementById('reminder_day').value;
                        const reminderHour = document.getElementById('reminder_hour').value;
                        const reminderMinute = document.getElementById('reminder_minute').value;
                        
                        const dueYear = document.getElementById('due_year').value;
                        const dueMonth = document.getElementById('due_month').value;
                        const dueDay = document.getElementById('due_day').value;
                        const dueHour = document.getElementById('due_hour').value;
                        const dueMinute = document.getElementById('due_minute').value;
                        
                        // 只有当所有时间组件都有值时，才更新隐藏输入框
                        if (reminderYear && reminderMonth && reminderDay && reminderHour && reminderMinute) {
                            updateDateTimeInput('reminder_', 'reminder_time');
                        } else {
                            // 否则移除name属性，不提交
                            const reminderTimeInput = document.getElementById('reminder_time');
                            if (reminderTimeInput) {
                                reminderTimeInput.removeAttribute('name');
                            }
                        }
                        
                        if (dueYear && dueMonth && dueDay && dueHour && dueMinute) {
                            updateDateTimeInput('due_', 'due_date');
                        } else {
                            // 否则移除name属性，不提交
                            const dueDateInput = document.getElementById('due_date');
                            if (dueDateInput) {
                                dueDateInput.removeAttribute('name');
                            }
                        }
                    } else {
                        // 在添加任务页面，正常更新时间输入框
                        updateDateTimeInput('reminder_', 'reminder_time');
                        updateDateTimeInput('due_', 'due_date');
                    }
                    
                    // 验证提醒时间
                    if (reminderTimeInput && dueDateInput) {
                        const reminderTime = reminderTimeInput.value;
                        const dueDate = dueDateInput.value;
                        
                        if (reminderTime && dueDate) {
                            const reminderDateTime = new Date(reminderTime);
                            const dueDateTime = new Date(dueDate);
                            
                            if (reminderDateTime > dueDateTime) {
                                e.preventDefault();
                                alert('提醒时间不能晚于截止时间');
                                return;
                            }
                        }
                    }
                    
                    // 处理自定义提醒天数
                    if (reminderPeriodSelect && reminderPeriodSelect.value === 'custom') {
                        const checkboxes = document.querySelectorAll('input[name="custom_reminder_days"]:checked');
                        const selectedDays = Array.from(checkboxes).map(cb => cb.value).join(',');
                        
                        if (selectedDays.length === 0) {
                            e.preventDefault();
                            alert('请至少选择一天作为提醒日');
                            return;
                        }
                        
                        // 创建一个隐藏输入来存储自定义提醒天数
                        let hiddenInput = document.getElementById('custom_reminder_days_input');
                        if (!hiddenInput) {
                            hiddenInput = document.createElement('input');
                            hiddenInput.type = 'hidden';
                            hiddenInput.id = 'custom_reminder_days_input';
                            hiddenInput.name = 'custom_reminder_days';
                            form.appendChild(hiddenInput);
                        }
                        hiddenInput.value = selectedDays;
                    }
        });
        
        // 实时验证
        if (reminderTimeInput && dueDateInput) {
            reminderTimeInput.addEventListener('change', validateReminderTime);
            dueDateInput.addEventListener('change', validateReminderTime);
            
            function validateReminderTime() {
                const reminderTime = reminderTimeInput.value;
                const dueDate = dueDateInput.value;
                
                if (reminderTime && dueDate) {
                    const reminderDateTime = new Date(reminderTime);
                    const dueDateTime = new Date(dueDate);
                    
                    if (reminderDateTime > dueDateTime) {
                        alert('提醒时间不能晚于截止时间');
                    }
                }
            }
        }
    }
});
