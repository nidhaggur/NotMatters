// 翻译文件管理模块
class I18nManager {
    constructor() {
        this.translationVersion = 'v1.0';
        this.cache = new Map();
        this.isLoading = false;
    }
    
    // 初始化i18next
    init() {
        if (!window.i18next || !window.i18nextHttpBackend) {
            console.error('i18next or i18nextHttpBackend not loaded');
            return;
        }
        
        // 从localStorage获取语言，默认为'en'
        const savedLanguage = localStorage.getItem('language') || 'en';
        
        window.i18next
            .use(window.i18nextHttpBackend)
            .init({
                lng: savedLanguage,
                fallbackLng: 'en',
                debug: false, // 生产环境设为false
                backend: {
                    loadPath: this.getLoadPath.bind(this),
                    parse: this.parseTranslation.bind(this),
                    allowMultiLoading: true,
                    crossDomain: false,
                    requestOptions: {
                        mode: 'cors',
                        credentials: 'same-origin',
                        cache: 'default'
                    }
                },
                interpolation: {
                    escapeValue: false
                },
                saveMissing: false,
                saveMissingTo: 'all',
                load: 'languageOnly',
                onError: this.handleError.bind(this)
            });
    }
    
    // 获取加载路径
    getLoadPath(lngs, namespaces) {
        let lang = lngs && lngs.length > 0 ? lngs[0] : 'en';
        
        // 语言映射
        if (lang === 'zh-CN' || lang === 'zh-Hans') {
            lang = 'zh';
        } else if (lang === 'en-US' || lang === 'en-GB' || lang === 'en-CA') {
            lang = 'en';
        }
        
        // 添加版本号参数，用于缓存控制
        return `/static/locales/${lang}/translation.json?v=${this.translationVersion}`;
    }
    
    // 解析翻译文件
    parseTranslation(data) {
        try {
            const parsedData = JSON.parse(data);
            return parsedData;
        } catch (error) {
            console.error('Error parsing translation file:', error);
            return {};
        }
    }
    
    // 处理错误
    handleError(err) {
        console.error('i18next error:', err);
    }
    
    // 切换语言
    changeLanguage(lang) {
        return new Promise((resolve, reject) => {
            if (!window.i18next) {
                reject(new Error('i18next not initialized'));
                return;
            }
            
            this.isLoading = true;
            this.showLoadingIndicator(true);
            
            window.i18next.changeLanguage(lang)
                .then(() => {
                    this.isLoading = false;
                    this.showLoadingIndicator(false);
                    resolve();
                })
                .catch(err => {
                    this.isLoading = false;
                    this.showLoadingIndicator(false);
                    reject(err);
                });
        });
    }
    
    // 应用语言到页面
    applyLanguage(lang) {
        return this.changeLanguage(lang).then(() => {
            this.updatePageElements();
        });
    }
    
    // 更新页面元素
    updatePageElements() {
        try {
            // 更新所有带有data-lang属性的元素
            document.querySelectorAll('[data-lang]').forEach(element => {
                const key = element.getAttribute('data-lang');
                const translation = window.i18next.t(key);
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
                    titleElement.textContent = originalTitle.replace('事项提示器', window.i18next.t('appTitle')).replace('NotMatters', window.i18next.t('appTitle'));
                }
            }
        } catch (error) {
            console.error('Error updating page elements:', error);
        }
    }
    
    // 显示加载指示器
    showLoadingIndicator(show) {
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
    
    // 检查翻译文件是否存在
    checkTranslationFile(lang) {
        return new Promise((resolve, reject) => {
            const url = this.getLoadPath([lang], ['translation']);
            fetch(url, {
                method: 'HEAD',
                cache: 'no-cache'
            })
            .then(response => {
                resolve(response.ok);
            })
            .catch(error => {
                console.error('Error checking translation file:', error);
                reject(error);
            });
        });
    }
    
    // 预加载翻译文件
    preloadTranslation(lang) {
        return new Promise((resolve, reject) => {
            if (!window.i18next) {
                reject(new Error('i18next not initialized'));
                return;
            }
            
            window.i18next.loadLanguages([lang])
                .then(() => {
                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
}

// 导出单例
const i18nManager = new I18nManager();

// 页面加载时初始化
if (typeof window !== 'undefined') {
    window.i18nManager = i18nManager;
    
    // 当DOM加载完成时初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            i18nManager.init();
        });
    } else {
        i18nManager.init();
    }
}