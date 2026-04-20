// 提醒队列管理
var reminderQueue = [];
var isProcessingQueue = false;
var currentPopup = null;
var currentAudio = null;
var currentIntervalId = null;
var defaultSoundUrl = '/static/videos/任务提醒音.mp3';
var ws = null;

// 初始化WebSocket连接
function initWebSocket() {
    if (window.WebSocket) {
        // 检查是否已有连接，如果有且未关闭，则先关闭
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            try {
                ws.close();
            } catch (e) {
                console.warn('关闭已有WebSocket连接时出错:', e);
            }
        }
        
        // 获取CSRF token
        const csrfToken = getCSRFToken();
        
        // 构建WebSocket URL
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/reminders/`;
        
        // 创建WebSocket连接
        ws = new WebSocket(wsUrl);
        
        ws.onopen = function() {
            console.log('WebSocket连接已建立');
        };
        
        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.reminders && data.reminders.length > 0) {
                    // 优先使用用户自定义音效，否则使用默认音效
                    const soundUrl = data.user_sound_url || data.default_sound_url || defaultSoundUrl;

                    data.reminders.forEach(task => {
                        // 在浏览器控制台显示邮件内容
                        if (task.email_content) {
                            console.log('=== 邮件提醒 ===');
                            console.log('主题:', task.email_content.subject);
                            console.log('发件人:', task.email_content.from_email);
                            console.log('收件人:', task.email_content.to_email);
                            console.log('内容:');
                            console.log(task.email_content.message);
                            console.log('================');
                        }

                        // 添加到队列
                        reminderQueue.push({
                            task: task,
                            soundUrl: soundUrl
                        });
                    });

                    // 如果没有正在处理的弹窗，开始处理队列
                    if (!isProcessingQueue) {
                        processReminderQueue();
                    }
                }
            } catch (error) {
                console.error('解析WebSocket消息失败:', error);
            }
        };
        
        ws.onerror = function(error) {
            console.error('WebSocket错误:', error);
            // 尝试重连
            setTimeout(initWebSocket, 5000);
        };
        
        ws.onclose = function() {
            console.log('WebSocket连接已关闭');
            // 尝试重连
            setTimeout(initWebSocket, 5000);
        };
    } else {
        console.warn('您的浏览器不支持WebSocket，将使用轮询方式');
        // 回退到轮询方式
        startPolling();
    }
}

// 回退到轮询方式
function startPolling() {
    const config = getReminderConfig();
    if (config.checkRemindersUrl) {
        setInterval(checkReminders, 10000);
        checkReminders();
    }
}

// 获取配置信息
function getReminderConfig() {
    const body = document.body;
    return {
        checkRemindersUrl: body.getAttribute('data-check-reminders-url'),
        updateTaskStatusUrl: body.getAttribute('data-update-task-status-url')
    };
}

// 检查任务提醒（轮询方式）
function checkReminders() {
    const config = getReminderConfig();
    if (!config.checkRemindersUrl) return;

    fetch(config.checkRemindersUrl, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return { reminders: [] };
        }
    })
    .then(data => {
        if (data.reminders && data.reminders.length > 0) {
            // 优先使用用户自定义音效，否则使用默认音效
            const soundUrl = data.user_sound_url || data.default_sound_url || defaultSoundUrl;

            data.reminders.forEach(task => {
                // 在浏览器控制台显示邮件内容
                if (task.email_content) {
                    console.log('=== 邮件提醒 ===');
                    console.log('主题:', task.email_content.subject);
                    console.log('发件人:', task.email_content.from_email);
                    console.log('收件人:', task.email_content.to_email);
                    console.log('内容:');
                    console.log(task.email_content.message);
                    console.log('================');
                }

                // 添加到队列
                reminderQueue.push({
                    task: task,
                    soundUrl: soundUrl
                });
            });

            // 如果没有正在处理的弹窗，开始处理队列
            if (!isProcessingQueue) {
                processReminderQueue();
            }
        }
    })
    .catch(error => console.error('Error checking reminders:', error));
}

// 处理提醒队列
function processReminderQueue() {
    if (reminderQueue.length === 0) {
        isProcessingQueue = false;
        return;
    }

    isProcessingQueue = true;
    const item = reminderQueue.shift();
    showReminderPopup(item.task, item.soundUrl);
}

// 显示提醒弹窗
function showReminderPopup(task, soundUrl) {
    const config = getReminderConfig();
    if (!config.updateTaskStatusUrl) {
        processReminderQueue();
        return;
    }

    // 获取响铃时长设置（默认30秒）
    var ringDuration = parseInt(localStorage.getItem('ringDuration') || '30');

    // 创建音频对象
    var audio = new Audio(soundUrl);

    // 音频加载错误处理
    audio.addEventListener('error', function(e) {
        console.warn('音频加载失败，使用默认音效:', e);
        // 尝试使用默认音效
        if (soundUrl !== defaultSoundUrl) {
            audio.src = defaultSoundUrl;
        }
    });

    // 播放提醒音效（带错误处理）
    playSoundWithRetry(audio, 3);

    // 显示弹窗
    var popup = document.createElement('div');
    popup.className = 'modal fade show';
    popup.style.display = 'block';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.zIndex = '1050';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';

    // 确定状态选项
    var statusOptions = [];
    var progress_nodes = task.progress_nodes || ['待办', '进行中', '已完成'];
    var current_node_index = task.current_node_index || 0;

    if (task.status === 'completed') {
        statusOptions.push({
            status: 'completed',
            label: i18next.t('taskStatusCompleted'),
            className: 'btn-success'
        });
    } else {
        var isOverdue = false;
        if (task.due_date) {
            var dueDate = new Date(task.due_date);
            var now = new Date();
            isOverdue = now > dueDate;
        }

        if (isOverdue) {
            statusOptions.push({
                status: 'pending',
                label: '未完成',
                className: 'btn-danger'
            });
        } else {
            var isDefaultNodes = !task.progress_nodes || progress_nodes.join(',') === ['待办', '进行中', '已完成'].join(',');

            if (isDefaultNodes) {
                statusOptions.push({
                    status: 'pending',
                    label: i18next.t('taskStatusPending'),
                    className: 'btn-danger'
                });
            } else {
                var nextNodeIndex = current_node_index + 1;
                if (nextNodeIndex < progress_nodes.length - 1) {
                    statusOptions.push({
                        status: 'in_progress',
                        label: progress_nodes[nextNodeIndex],
                        className: 'btn-primary'
                    });
                } else {
                    statusOptions.push({
                        status: 'pending',
                        label: i18next.t('taskStatusPending'),
                        className: 'btn-danger'
                    });
                }
            }
        }

        statusOptions.push({
            status: 'completed',
            label: i18next.t('taskStatusCompleted'),
            className: 'btn-success'
        });
    }

    // 生成按钮HTML
    var buttonsHTML = '';
    statusOptions.forEach(function(option) {
        buttonsHTML += '<button type="button" class="btn ' + option.className + ' flex-grow-1" onclick="updateTaskStatusAndClose(' + task.id + ', \'' + option.status + '\', this)">' + option.label + '</button>';
    });

    var popupHTML = "<div class=\"modal-dialog\" style=\"margin: 0 auto; margin-top: 10%; max-width: 500px;\">" +
        "<div class=\"modal-content\">" +
        "<div class=\"modal-header\">" +
        "<h5 class=\"modal-title\">" + i18next.t('taskReminder') + " (" + (reminderQueue.length + 1) + " 个待处理)</h5>" +
        "<button type=\"button\" class=\"btn-close\" onclick=\"closePopupAndNext(this)\"></button>" +
        "</div>" +
        "<div class=\"modal-body\">" +
        "<h6>" + (task.title || i18next.t('noTitle')) + "</h6>" +
        "<p>" + (task.description || i18next.t('noDescription')) + "</p>" +
        "<p class=\"text-muted\">" + i18next.t('dueDate') + ": " + (task.due_date || '无') + "</p>" +
        "<div class=\"mt-4\">" +
        "<p>" + i18next.t('selectTaskStatus') + "</p>" +
        "<div class=\"d-flex gap-2\">" + buttonsHTML + "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";

    popup.innerHTML = popupHTML;
    document.body.appendChild(popup);

    // 保存状态到弹窗元素
    popup.dataset.taskId = task.id;
    popup.dataset.audioSrc = audio.src;

    // 设置定时器，根据响铃时长重复播放提醒音
    var startTime = Date.now();
    var intervalId = setInterval(function() {
        if (Date.now() - startTime > ringDuration * 1000) {
            clearInterval(intervalId);
            return;
        }

        if (!document.contains(popup)) {
            clearInterval(intervalId);
            return;
        }

        if (audio.paused) {
            audio.currentTime = 0;
            audio.play().catch(function(e) {
                console.warn('音频播放失败:', e);
            });
        }
    }, 5000);

    currentPopup = popup;
    currentAudio = audio;
    currentIntervalId = intervalId;
}

// 带重试的音频播放
function playSoundWithRetry(audio, retries) {
    audio.play().catch(function(e) {
        console.warn('音频播放失败，尝试重试:', e);
        if (retries > 0) {
            setTimeout(function() {
                playSoundWithRetry(audio, retries - 1);
            }, 1000);
        }
    });
}

// 关闭弹窗并处理下一个
function closePopupAndNext(element) {
    var popup = element.closest('.modal');
    if (popup) {
        if (currentIntervalId) {
            clearInterval(currentIntervalId);
        }
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        popup.remove();
        currentPopup = null;

        // 处理队列中的下一个提醒
        setTimeout(processReminderQueue, 300);
    }
}

// 更新任务状态并关闭弹窗
function updateTaskStatusAndClose(taskId, status, buttonElement) {
    const config = getReminderConfig();
    if (!config.updateTaskStatusUrl) return;

    // 禁用按钮防止重复点击
    if (buttonElement) {
        buttonElement.disabled = true;
    }

    fetch(config.updateTaskStatusUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ task_id: taskId, status: status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 关闭所有弹窗并清除定时器
            document.querySelectorAll('.modal').forEach(popup => {
                if (currentIntervalId) {
                    clearInterval(currentIntervalId);
                }
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }
                popup.remove();
            });
            currentPopup = null;

            // 处理队列中的下一个提醒
            setTimeout(processReminderQueue, 300);
        }
    })
    .catch(error => {
        console.error('Error updating task status:', error);
        if (buttonElement) {
            buttonElement.disabled = false;
        }
    });
}

// 关闭弹窗（兼容旧代码）
function closePopup(element) {
    var popup = element.closest('.modal');
    if (popup) {
        var intervalId = popup.dataset.intervalId;
        if (intervalId) {
            clearInterval(intervalId);
        }
        popup.remove();
    }
}

// 更新任务状态（兼容旧代码）
function updateTaskStatus(taskId, status) {
    const config = getReminderConfig();
    if (!config.updateTaskStatusUrl) return;

    fetch(config.updateTaskStatusUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ task_id: taskId, status: status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.querySelectorAll('.modal').forEach(popup => {
                var intervalId = popup.dataset.intervalId;
                if (intervalId) {
                    clearInterval(intervalId);
                }
                popup.remove();
            });
        }
    })
    .catch(error => console.error('Error updating task status:', error));
}

// 获取CSRF token
function getCSRFToken() {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, 10) === 'csrftoken=') {
                cookieValue = decodeURIComponent(cookie.substring(10));
                break;
            }
        }
    }
    return cookieValue;
}

// 页面加载时初始化WebSocket
if (window.addEventListener) {
    window.addEventListener('load', initWebSocket, false);
} else if (window.attachEvent) {
    window.attachEvent('onload', initWebSocket);
} else {
    window.onload = initWebSocket;
}