// 为所有卡片添加点击事件，切换描述的显示方式
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const descElement = this.querySelector('[id^="desc-"]');
            if (descElement) {
                // 检查当前是否显示的是截断的内容
                if (descElement.dataset.isExpanded) {
                    // 恢复显示截断的内容
                    if (descElement.dataset.fullText && descElement.dataset.fullText.length > 100) {
                        descElement.textContent = descElement.dataset.fullText.substring(0, 100) + '...';
                    } else {
                        descElement.textContent = descElement.dataset.fullText || '无描述';
                    }
                    delete descElement.dataset.isExpanded;
                } else {
                    // 显示完整内容
                    descElement.textContent = descElement.dataset.fullText || '无描述';
                    // 标记为已展开
                    descElement.dataset.isExpanded = 'true';
                }
            }
        });
    });
    
    // 批量操作UI控制
    const batchButton = document.getElementById('batchButton');
    const batchActions = document.getElementById('batchActions');
    const cancelBatchButton = document.getElementById('cancelBatch');
    const taskCheckboxes = document.querySelectorAll('.task-checkbox');
    
    // 初始隐藏任务复选框
    taskCheckboxes.forEach(checkbox => {
        checkbox.style.display = 'none';
    });
    
    // 显示批量操作选项
    batchButton.addEventListener('click', function() {
        batchButton.classList.add('d-none');
        batchActions.classList.remove('d-none');
        // 显示任务复选框
        taskCheckboxes.forEach(checkbox => {
            checkbox.style.display = 'block';
        });
    });
    
    // 取消批量操作
    cancelBatchButton.addEventListener('click', function() {
        batchActions.classList.add('d-none');
        batchButton.classList.remove('d-none');
        // 隐藏任务复选框
        taskCheckboxes.forEach(checkbox => {
            checkbox.style.display = 'none';
        });
        // 取消全选
        document.getElementById('selectAll').checked = false;
        taskCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    });
    
    // 批量操作功能
    const selectAllCheckbox = document.getElementById('selectAll');
    const batchDeleteButton = document.getElementById('batchDelete');
    const batchCompleteButton = document.getElementById('batchComplete');
    
    // 全选/取消全选
    selectAllCheckbox.addEventListener('change', function() {
        taskCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    
    // 单个复选框变化时，更新全选状态
    taskCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allChecked = Array.from(taskCheckboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        });
    });
    
    // 批量删除
    batchDeleteButton.addEventListener('click', function() {
        const selectedTaskIds = Array.from(taskCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
        
        if (selectedTaskIds.length === 0) {
            alert('请选择要删除的任务');
            return;
        }
        
        if (confirm('确定要删除选中的任务吗？')) {
            // 发送删除请求
            selectedTaskIds.forEach(taskId => {
                fetch(`/tasks/delete/${taskId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCsrfToken(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({})
                })
                .then(response => {
                    if (response.ok) {
                        // 删除成功后刷新页面
                        window.location.reload();
                    } else {
                        alert('删除失败');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('删除失败');
                });
            });
        }
    });
    
    // 批量标记完成
    batchCompleteButton.addEventListener('click', function() {
        const selectedTaskIds = Array.from(taskCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
        
        if (selectedTaskIds.length === 0) {
            alert('请选择要标记完成的任务');
            return;
        }
        
        // 发送更新状态请求
        selectedTaskIds.forEach(taskId => {
            fetch('/tasks/update-status/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task_id: taskId,
                    status: 'completed'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 更新成功后刷新页面
                    window.location.reload();
                } else {
                    alert('更新失败');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('更新失败');
            });
        });
    });
    
    // 获取CSRF令牌
    function getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue;
    }
});
