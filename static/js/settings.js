// 初始化i18next
function initI18next() {
    // 从localStorage获取语言，默认为'en'
    const savedLanguage = localStorage.getItem('language') || 'en';
    
    // 翻译文件版本号，用于缓存控制
    const translationVersion = 'v1.0';
    
    i18next
        .use(i18nextHttpBackend)
        .init({
            lng: savedLanguage,
            fallbackLng: 'en',
            debug: false, // 生产环境设为false
            backend: {
                loadPath: function(lngs, namespaces) {
                    // 确保lngs数组至少有一个元素
                    let lang = lngs && lngs.length > 0 ? lngs[0] : 'en';
                    // 语言映射：将zh-CN映射到zh，将en-US映射到en
                    if (lang === 'zh-CN' || lang === 'zh-Hans') {
                        lang = 'zh';
                    } else if (lang === 'en-US' || lang === 'en-GB' || lang === 'en-CA') {
                        lang = 'en';
                    }
                    // 添加版本号参数，用于缓存控制
                    return `/static/locales/${lang}/translation.json?v=${translationVersion}`;
                },
                parse: function(data) {
                    try {
                        return JSON.parse(data);
                    } catch (error) {
                        console.error('Error parsing translation file:', error);
                        return {};
                    }
                },
                // 缓存配置
                allowMultiLoading: true,
                crossDomain: false,
                // 错误处理
                requestOptions: {
                    mode: 'cors',
                    credentials: 'same-origin',
                    cache: 'default'
                }
            },
            interpolation: {
                escapeValue: false
            },
            // 缓存翻译
            saveMissing: false,
            saveMissingTo: 'all',
            // 加载策略
            load: 'languageOnly', // 只加载语言代码，不加载地区代码
            // 监听加载错误
            onError: function(err) {
                console.error('i18next initialization error:', err);
            }
        });
}

// 应用语言
function applyLanguage(language) {
    // 确保语言值不为空，默认为'en'
    const lang = language || 'en';
    
    // 显示加载状态
    showLoadingIndicator(true);
    
    // 切换i18next语言
    i18next.changeLanguage(lang).then(() => {
        try {
            // 更新所有带有data-lang属性的元素
            document.querySelectorAll('[data-lang]').forEach(element => {
                const key = element.getAttribute('data-lang');
                const translation = i18next.t(key);
                if (translation) {
                    // 处理普通文本内容
                    element.textContent = translation;
                    // 处理placeholder属性
                    if (element.tagName === 'INPUT' && element.type === 'text') {
                        element.placeholder = translation;
                    }
                    // 处理title属性
                    if (element.hasAttribute('title')) {
                        element.title = translation;
                    }
                }
            });
            
            // 更新页面标题
            const titleElement = document.querySelector('title');
            if (titleElement) {
                const originalTitle = titleElement.textContent;
                if (originalTitle.includes('事项提示器') || originalTitle.includes('NotMatters')) {
                    titleElement.textContent = originalTitle.replace('事项提示器', i18next.t('appTitle')).replace('NotMatters', i18next.t('appTitle'));
                }
            }
            
            // 隐藏加载状态
            showLoadingIndicator(false);
        } catch (error) {
            console.error('Error applying language:', error);
            // 隐藏加载状态
            showLoadingIndicator(false);
        }
    }).catch(error => {
        console.error('Error changing language:', error);
        // 隐藏加载状态
        showLoadingIndicator(false);
    });
}

// 显示加载指示器
function showLoadingIndicator(show) {
    let loadingElement = document.getElementById('language-loading');
    if (!loadingElement) {
        // 创建加载指示器元素
        loadingElement = document.createElement('div');
        loadingElement.id = 'language-loading';
        loadingElement.style.position = 'fixed';
        loadingElement.style.top = '50%';
        loadingElement.style.left = '50%';
        loadingElement.style.transform = 'translate(-50%, -50%)';
        loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        loadingElement.style.color = 'white';
        loadingElement.style.padding = '15px 25px';
        loadingElement.style.borderRadius = '5px';
        loadingElement.style.zIndex = '9999';
        loadingElement.style.display = 'none';
        loadingElement.textContent = '加载语言中...';
        document.body.appendChild(loadingElement);
    }
    
    loadingElement.style.display = show ? 'block' : 'none';
}

// 预加载音效
const buttonSound = new Audio('/static/videos/单击按钮提示音.mp3');
const reminderSound = new Audio('/static/videos/任务提醒音.mp3');

// 设置默认音量
buttonSound.volume = 0.5;
reminderSound.volume = 0.5;

// 格式化日期时间
function formatDateTime(date, format) {
    const savedDateFormat = localStorage.getItem('dateFormat') || 'YYYY-MM-DD';
    const savedTimeFormat = localStorage.getItem('timeFormat') || '24';
    const savedTimezone = localStorage.getItem('timezone') || 'Asia/Shanghai';
    
    // 根据时区调整日期
    let adjustedDate = date;
    try {
        // 使用Intl.DateTimeFormat来处理时区
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: savedTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const parts = formatter.formatToParts(date);
        const values = {};
        parts.forEach(part => {
            values[part.type] = part.value;
        });
        
        const year = parseInt(values.year);
        const month = parseInt(values.month);
        const day = parseInt(values.day);
        const hours = parseInt(values.hour);
        const minutes = parseInt(values.minute);
        const seconds = parseInt(values.second);
        
        adjustedDate = new Date(year, month - 1, day, hours, minutes, seconds);
    } catch (error) {
        console.error('Error formatting date with timezone:', error);
    }
    
    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    let hours = adjustedDate.getHours();
    const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
    const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');
    
    let dateString = '';
    switch (savedDateFormat) {
        case 'YYYY-MM-DD':
            dateString = `${year}-${month}-${day}`;
            break;
        case 'DD/MM/YYYY':
            dateString = `${day}/${month}/${year}`;
            break;
        case 'MM/DD/YYYY':
            dateString = `${month}/${day}/${year}`;
            break;
        default:
            dateString = `${year}-${month}-${day}`;
    }
    
    let timeString = '';
    if (savedTimeFormat === '12') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 将0点转换为12点
        timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
    } else {
        timeString = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    }
    
    if (format === 'date') {
        return dateString;
    } else if (format === 'time') {
        return timeString;
    } else {
        return `${dateString} ${timeString}`;
    }
}

// 格式化页面上所有的日期时间显示
function formatAllDateTimes() {
    const datetimeElements = document.querySelectorAll('.datetime-display');
    datetimeElements.forEach(element => {
        const datetimeStr = element.getAttribute('data-datetime');
        if (datetimeStr) {
            try {
                const date = new Date(datetimeStr);
                if (!isNaN(date.getTime())) {
                    element.textContent = formatDateTime(date, 'datetime');
                }
            } catch (error) {
                console.error('Error formatting date:', error);
            }
        }
    });
}

// 音量控制函数
function setVolume(volume) {
    buttonSound.volume = volume;
    reminderSound.volume = volume;
}

// 应用主题
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        // 导航栏和底部栏
        document.querySelectorAll('.navbar').forEach(navbar => {
            navbar.classList.remove('navbar-light', 'bg-light');
            navbar.classList.add('navbar-dark', 'bg-dark');
        });
        document.querySelectorAll('.footer').forEach(footer => {
            footer.classList.remove('bg-light');
            footer.classList.add('bg-dark', 'text-light');
        });
        // 下拉菜单
        document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
            dropdown.classList.remove('bg-light');
            dropdown.classList.add('bg-dark', 'text-light', 'border-secondary');
        });
        // 卡片
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('bg-light');
            card.classList.add('bg-dark', 'text-light', 'border-secondary');
        });
        // 表单控件和按钮
        document.querySelectorAll('.form-control, .btn').forEach(element => {
            element.classList.remove('bg-light', 'text-dark');
            element.classList.add('bg-secondary', 'text-light', 'border-secondary');
        });
        // 链接和文本
        document.querySelectorAll('.nav-link, .navbar-brand, .dropdown-item, .text-muted, a, .footer .text-muted').forEach(element => {
            element.classList.add('text-light');
        });
        // 表格主题
        document.querySelectorAll('.table').forEach(table => {
            table.classList.add('text-light');
            table.classList.add('table-dark');
        });
        document.querySelectorAll('.table-striped > tbody > tr:nth-of-type(odd)').forEach(row => {
            row.classList.remove('bg-light');
            row.classList.add('bg-secondary', 'bg-opacity-25');
        });
        document.querySelectorAll('thead').forEach(thead => {
            thead.classList.remove('bg-light');
            thead.classList.add('bg-secondary');
        });
        // 徽章主题
        document.querySelectorAll('.badge').forEach(badge => {
            badge.classList.remove('text-dark');
        });
        // 容器
        document.querySelectorAll('.container').forEach(container => {
            container.classList.add('text-light');
        });
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        // 导航栏和底部栏
        document.querySelectorAll('.navbar').forEach(navbar => {
            navbar.classList.remove('navbar-dark', 'bg-dark');
            navbar.classList.add('navbar-light', 'bg-light');
        });
        document.querySelectorAll('.footer').forEach(footer => {
            footer.classList.remove('bg-dark', 'text-light');
            footer.classList.add('bg-light');
        });
        // 下拉菜单
        document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
            dropdown.classList.remove('bg-dark', 'text-light', 'border-secondary');
            dropdown.classList.add('bg-light');
        });
        // 卡片
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('bg-dark', 'text-light', 'border-secondary');
            card.classList.add('bg-light');
        });
        // 表单控件
        document.querySelectorAll('.form-control').forEach(element => {
            element.classList.remove('bg-secondary', 'text-light', 'border-secondary');
            element.classList.add('bg-light', 'text-dark');
        });
        // 按钮
        document.querySelectorAll('.btn').forEach(element => {
            element.classList.remove('bg-secondary', 'text-light', 'border-secondary');
        });
        // 链接和文本
        document.querySelectorAll('.nav-link, .navbar-brand, .dropdown-item, .text-muted, a, .footer .text-muted').forEach(element => {
            element.classList.remove('text-light');
        });
        // 表格主题
        document.querySelectorAll('.table').forEach(table => {
            table.classList.remove('text-light');
            table.classList.remove('table-dark');
        });
        document.querySelectorAll('.table-striped > tbody > tr:nth-of-type(odd)').forEach(row => {
            row.classList.remove('bg-secondary', 'bg-opacity-25');
            row.classList.add('bg-light');
        });
        document.querySelectorAll('thead').forEach(thead => {
            thead.classList.remove('bg-secondary');
            thead.classList.add('bg-light');
        });
        // 徽章主题
        document.querySelectorAll('.badge').forEach(badge => {
            badge.classList.add('text-dark');
        });
        // 容器
        document.querySelectorAll('.container').forEach(container => {
            container.classList.remove('text-light');
        });
    }
}

// 保存单个设置
function saveSetting(key, value) {
    localStorage.setItem(key, value);
}

// 加载设置
function loadSettings() {
    // 加载主题设置
    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const themeElement = document.getElementById('theme');
    if (themeElement) {
        themeElement.value = theme;
    }
    applyTheme(theme);
    
    // 加载音量设置
    const savedVolume = localStorage.getItem('volume');
    if (savedVolume) {
        const volumeElement = document.getElementById('volume');
        const volumeValueElement = document.getElementById('volumeValue');
        if (volumeElement) {
            volumeElement.value = savedVolume;
        }
        if (volumeValueElement) {
            volumeValueElement.textContent = savedVolume + '%';
        }
        setVolume(parseFloat(savedVolume) / 100);
    }
    
    // 加载响铃时长设置
    const savedRingDuration = localStorage.getItem('ringDuration');
    if (savedRingDuration) {
        const ringDurationElement = document.getElementById('ringDuration');
        if (ringDurationElement) {
            ringDurationElement.value = savedRingDuration;
        }
    }
    
    // 加载语言设置
    const savedLanguage = localStorage.getItem('language') || 'en';
    const languageElement = document.getElementById('language');
    if (languageElement) {
        languageElement.value = savedLanguage;
    }
    // 使用i18nManager应用语言
    if (window.i18nManager) {
        window.i18nManager.applyLanguage(savedLanguage);
    } else {
        applyLanguage(savedLanguage);
    }
    
    // 加载时区设置
    const savedTimezone = localStorage.getItem('timezone');
    if (savedTimezone) {
        const timezoneElement = document.getElementById('timezone');
        if (timezoneElement) {
            timezoneElement.value = savedTimezone;
        }
    }
    
    // 加载日期格式设置
    const savedDateFormat = localStorage.getItem('dateFormat');
    if (savedDateFormat) {
        const dateFormatElement = document.getElementById('dateFormat');
        if (dateFormatElement) {
            dateFormatElement.value = savedDateFormat;
        }
    }
    
    // 加载时间格式设置
    const savedTimeFormat = localStorage.getItem('timeFormat');
    if (savedTimeFormat) {
        const timeFormatElement = document.getElementById('timeFormat');
        if (timeFormatElement) {
            timeFormatElement.value = savedTimeFormat;
        }
    }
    
    // 格式化页面上的日期时间显示
    formatAllDateTimes();
}

// 初始化设置
function initSettings() {
    // 初始化i18next（使用i18nManager）
    if (window.i18nManager) {
        window.i18nManager.init();
    }
    
    // 为所有按钮添加点击音效
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            buttonSound.currentTime = 0;
            buttonSound.play();
        });
    });
    
    // 任务提醒由reminder.js处理
    
    // 加载设置
    loadSettings();
    
    // 音量滑块实时显示值
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volumeValue');
    
    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', function() {
            volumeValue.textContent = this.value + '%';
        });
        
        // 当音量滑块调整结束时，播放一次任务提示音并保存设置
        volumeSlider.addEventListener('mouseup', function() {
            const volume = this.value / 100;
            setVolume(volume);
            saveSetting('volume', this.value);
            
            // 播放任务提示音
            const reminderSound = new Audio('/static/videos/任务提醒音.mp3');
            reminderSound.volume = volume;
            reminderSound.currentTime = 0;
            reminderSound.play();
        });
    }
    
    // 主题选择变化时应用主题并保存设置
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            const theme = this.value;
            applyTheme(theme);
            saveSetting('theme', theme);
        });
    }
    
    // 语言选择变化时保存设置并应用
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const language = this.value;
            saveSetting('language', language);
            // 使用i18nManager应用语言
            if (window.i18nManager) {
                window.i18nManager.applyLanguage(language);
            } else {
                applyLanguage(language);
            }
        });
    }
    
    // 响铃时长变化时保存设置
    const ringDurationInput = document.getElementById('ringDuration');
    if (ringDurationInput) {
        ringDurationInput.addEventListener('change', function() {
            saveSetting('ringDuration', this.value);
        });
    }
    
    // 时区选择变化时保存设置并重新格式化日期时间
    const timezoneSelect = document.getElementById('timezone');
    if (timezoneSelect) {
        timezoneSelect.addEventListener('change', function() {
            saveSetting('timezone', this.value);
            formatAllDateTimes();
        });
    }
    
    // 日期格式选择变化时保存设置并重新格式化日期时间
    const dateFormatSelect = document.getElementById('dateFormat');
    if (dateFormatSelect) {
        dateFormatSelect.addEventListener('change', function() {
            saveSetting('dateFormat', this.value);
            formatAllDateTimes();
        });
    }
    
    // 时间格式选择变化时保存设置并重新格式化日期时间
    const timeFormatSelect = document.getElementById('timeFormat');
    if (timeFormatSelect) {
        timeFormatSelect.addEventListener('change', function() {
            saveSetting('timeFormat', this.value);
            formatAllDateTimes();
        });
    }
}

// 页面加载时初始化设置
document.addEventListener('DOMContentLoaded', initSettings);
