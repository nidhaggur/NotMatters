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

// 设置默认时间
document.addEventListener('DOMContentLoaded', function() {
    const currentTime = getCurrentDateTime();
    document.getElementById('reminder_time').value = currentTime;
    document.getElementById('due_date').value = calculateDueDate(currentTime);
    
    // 当提醒时间变化时，自动更新截止时间
    document.getElementById('reminder_time').addEventListener('change', function() {
        document.getElementById('due_date').value = calculateDueDate(this.value);
    });
    
    // 处理提醒周期选择
    const reminderPeriodSelect = document.getElementById('reminder_period');
    const customReminderDaysDiv = document.getElementById('custom-reminder-days');
    
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
    
    // 表单提交处理
    const form = document.querySelector('form');
    form.addEventListener('submit', function(e) {
        // 验证提醒时间
        const reminderTime = document.getElementById('reminder_time').value;
        const dueDate = document.getElementById('due_date').value;
        
        if (reminderTime && dueDate) {
            const reminderDateTime = new Date(reminderTime);
            const dueDateTime = new Date(dueDate);
            
            if (reminderDateTime > dueDateTime) {
                e.preventDefault();
                alert('提醒时间不能晚于截止时间');
                return;
            }
        }
        
        // 处理自定义提醒天数
        if (reminderPeriodSelect.value === 'custom') {
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
    document.getElementById('reminder_time').addEventListener('change', validateReminderTime);
    document.getElementById('due_date').addEventListener('change', validateReminderTime);
    
    function validateReminderTime() {
        const reminderTime = document.getElementById('reminder_time').value;
        const dueDate = document.getElementById('due_date').value;
        
        if (reminderTime && dueDate) {
            const reminderDateTime = new Date(reminderTime);
            const dueDateTime = new Date(dueDate);
            
            if (reminderDateTime > dueDateTime) {
                alert('提醒时间不能晚于截止时间');
            }
        }
    }
});
