from django.shortcuts import render, redirect, get_object_or_404, reverse
from django.core.mail import send_mail
from django.conf import settings
from .models import Task, UserProfile, UserSession
from django.db import models
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponse
from rest_framework_simplejwt.tokens import RefreshToken
import json
import urllib.parse
import datetime
import os
import csv
import io
import logging

# 配置日志
logger = logging.getLogger(__name__)

# 优先级转换函数
def priority_to_int(priority):
    priority_map = {'high': 0, 'medium': 1, 'low': 2}
    return priority_map.get(priority, 3)

# 首页视图
def index(request):
    now = timezone.now()
    # 转换为本地时区后再获取日期
    today = timezone.localtime(now).date()
    context = {
        'today': today
    }
    
    if request.user.is_authenticated:
        # 构建日期范围
        today_start = timezone.make_aware(datetime.datetime.combine(today, datetime.datetime.min.time()))
        today_end = timezone.make_aware(datetime.datetime.combine(today, datetime.datetime.max.time()))
        
        # 数据库层面过滤今日任务
        today_tasks = Task.objects.filter(
            user=request.user,
            due_date__gte=today_start,
            due_date__lte=today_end
        ).order_by('-priority', 'due_date')
        
        # 数据库层面过滤过期任务
        overdue_tasks = Task.objects.filter(
            user=request.user,
            due_date__lt=today_start,
            status__in=['pending', 'in_progress']
        ).order_by('-priority', 'due_date')
        
        # 获取所有有截止日期的任务，用于日历标记
        tasks_with_due_date = Task.objects.filter(
            user=request.user,
            due_date__isnull=False
        )
        
        # 统计每天的任务数量（使用本地时区日期）
        task_counts = {}
        for task in tasks_with_due_date:
            # 转换为本地时区后生成日期键
            local_date = timezone.localtime(task.due_date).date()
            date_key = local_date.isoformat()
            if date_key in task_counts:
                task_counts[date_key] += 1
            else:
                task_counts[date_key] = 1
        
        context.update({
            'today_tasks': today_tasks,
            'overdue_tasks': overdue_tasks,
            'task_counts': json.dumps(task_counts)
        })
    
    return render(request, 'index.html', context)

# 登录视图
def login_view(request):
    from .forms import LoginForm
    # 获取从切换账号页面传递的username参数
    username = request.GET.get('username', '')
    
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                
                # 生成JWT token
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                # 获取设备信息
                device_info = request.META.get('HTTP_USER_AGENT', 'Unknown Device')
                
                # 保存会话信息
                user_session = UserSession.objects.create(
                    user=user,
                    token=access_token,
                    device_info=device_info
                )
                
                # 更新近期登录账号列表
                recent_accounts = []
                
                # 先从session中获取
                if 'recent_accounts' in request.session:
                    recent_accounts = request.session['recent_accounts']
                
                # 再从cookie中获取之前登录过的账号
                for key in request.COOKIES:
                    if key.startswith('user_'):
                        # 提取并解码用户名（避免CookieError）
                        encoded_username = key[5:]
                        cookie_username = urllib.parse.unquote(encoded_username)
                        if cookie_username != username and not any(account['username'] == cookie_username for account in recent_accounts):
                            recent_accounts.append({'username': cookie_username})
                
                # 移除已存在的相同账号
                recent_accounts = [account for account in recent_accounts if account['username'] != username]
                
                # 添加当前账号到列表开头
                recent_accounts.insert(0, {'username': username})
                
                # 只保留最近5个账号
                recent_accounts = recent_accounts[:5]
                
                # 更新session
                request.session['recent_accounts'] = recent_accounts
                
                # 设置cookie，过期时间为7天（对用户名进行URL编码，避免CookieError）
                encoded_username = urllib.parse.quote(username)
                response = redirect('index')
                response.set_cookie(f'user_{encoded_username}', 'valid', max_age=7*24*60*60)
                response.set_cookie(f'token_{encoded_username}', access_token, max_age=7*24*60*60)
                return response
            else:
                # 登录失败，显示错误信息
                return render(request, 'login.html', {'form': form, 'error': '用户名或密码错误'})
        else:
            # 表单验证失败
            return render(request, 'login.html', {'form': form})
    else:
        form = LoginForm(initial={'username': username})
    return render(request, 'login.html', {'form': form})

# 注册视图
def register(request):
    from .forms import RegisterForm
    
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            # 表单验证通过
            username = form.cleaned_data['username']
            email = form.cleaned_data['email']
            password = form.cleaned_data['password1']
            
            try:
                user = User.objects.create_user(username=username, email=email, password=password)
                user.save()
                return redirect('login')
            except Exception as e:
                logger.error(f'用户注册失败: {e}', exc_info=True)
                return render(request, 'register.html', {'form': form, 'error': '注册失败，请稍后重试'})
        else:
            # 表单验证失败
            return render(request, 'register.html', {'form': form})
    else:
        form = RegisterForm()
    return render(request, 'register.html', {'form': form})

# 任务列表视图
@login_required
def task_list(request):
    from datetime import datetime
    
    # 获取搜索参数
    search_query = request.GET.get('search', '')
    priority_filter = request.GET.get('priority', '')
    date_filter = request.GET.get('date', '')
    tags_filter = request.GET.get('tags', '')
    
    # 构建查询，使用select_related减少数据库查询
    tasks = Task.objects.select_related('user').filter(user=request.user)
    
    # 关键词搜索
    if search_query:
        tasks = tasks.filter(
            models.Q(title__icontains=search_query) |
            models.Q(description__icontains=search_query)
        )
    
    # 优先级筛选
    if priority_filter:
        tasks = tasks.filter(priority=priority_filter)
    
    # 日期筛选
    if date_filter:
        try:
            target_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
            
            # 处理时区问题，构建日期范围查询
            from datetime import timedelta
            start_date = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
            end_date = start_date + timedelta(days=1)
            
            # 使用日期范围查询，避免时区问题
            tasks = tasks.filter(due_date__gte=start_date, due_date__lt=end_date)
        except ValueError as e:
            logger.warning(f'日期格式错误: {e}')
            pass
    
    # 标签筛选
    if tags_filter:
        tasks = tasks.filter(tags=tags_filter)
    
    # 排序：优先级从高到低，时间从早到晚，空截止日期排在最后
    tasks = tasks.order_by(
        models.Case(
            models.When(priority='high', then=0),
            models.When(priority='medium', then=1),
            models.When(priority='low', then=2),
            default=3
        ),
        models.Case(
            models.When(due_date__isnull=True, then=datetime.max),
            default=models.F('due_date')
        ),
        'created_at'
    )
    
    # 为每个任务添加截断后的标题和描述
    for task in tasks:
        # 截断标题
        if task.title and len(task.title) > 100:
            task.truncated_title = task.title[:100] + '...'
        else:
            task.truncated_title = task.title
        
        # 截断描述
        if task.description and len(task.description) > 100:
            task.truncated_description = task.description[:100] + '...'
        else:
            task.truncated_description = task.description
    
    return render(request, 'task_reminder/task_list.html', {
        'tasks': tasks,
        'search_query': search_query,
        'priority_filter': priority_filter,
        'date_filter': date_filter,
        'tags_filter': tags_filter
    })

# 添加任务视图
@login_required
def add_task(request):
    from .forms import TaskForm
    if request.method == 'POST':
        form = TaskForm(request.POST)
        if form.is_valid():
            task = form.save(commit=False)
            task.user = request.user
            task.save()
            if request.user.is_staff:
                return redirect('admin_dashboard')
            else:
                return redirect('task_list')
        else:
            return render(request, 'task_reminder/add_task.html', {'form': form})
    else:
        form = TaskForm()
    return render(request, 'task_reminder/add_task.html', {'form': form})

# 编辑任务视图
@login_required
def edit_task(request, task_id):
    from .forms import TaskForm
    if request.user.is_staff:
        task = get_object_or_404(Task, id=task_id)
    else:
        task = get_object_or_404(Task, id=task_id, user=request.user)
    if request.method == 'POST':
        form = TaskForm(request.POST, instance=task)
        if form.is_valid():
            # 保存其他字段
            task = form.save(commit=False)
            task.status = request.POST.get('status', task.status)
            task.progress_nodes = request.POST.get('progress_nodes', task.progress_nodes)
            task.save()
            if request.user.is_staff:
                return redirect('admin_dashboard')
            else:
                return redirect('task_list')
        else:
            return render(request, 'task_reminder/edit_task.html', {'form': form, 'task': task})
    else:
        form = TaskForm(instance=task)
    return render(request, 'task_reminder/edit_task.html', {'form': form, 'task': task})

# 删除任务视图
@login_required
def delete_task(request, task_id):
    if request.user.is_staff:
        task = get_object_or_404(Task, id=task_id)
    else:
        task = get_object_or_404(Task, id=task_id, user=request.user)
    if request.method == 'POST':
        task.delete()
        if request.user.is_staff:
            return redirect('admin_dashboard')
        else:
            return redirect('task_list')
    return render(request, 'task_reminder/delete_task.html', {'task': task})

# 检查提醒视图
@login_required
def check_reminders(request):
    now = timezone.now()
    tasks = Task.objects.filter(user=request.user, reminder_time__lte=now, is_reminded=False)
    has_reminders = tasks.exists()
    
    # 对任务进行排序：优先级（高到低）、截止时间（早到晚）、创建时间（早到晚）
    def priority_to_int(priority):
        priority_map = {'high': 0, 'medium': 1, 'low': 2}
        return priority_map.get(priority, 3)
    
    # 转换为列表并排序
    tasks_list = list(tasks)
    tasks_list.sort(key=lambda task: (
        priority_to_int(task.priority),  # 优先级排序（高优先级在前）
        task.due_date or datetime.datetime.max.replace(tzinfo=timezone.get_current_timezone()),  # 截止时间排序（早的在前）
        task.created_at  # 创建时间排序（早的在前）
    ))
    
    # 构建提醒任务列表
    reminders = []
    for task in tasks_list:
        # 发送邮件提醒（改为在浏览器控制台显示）
        try:
            subject = f'任务提醒：{task.title}'
            message = f'您好！\n\n您有一个任务需要处理：\n\n任务标题：{task.title}\n任务描述：{task.description or "无"}\n截止时间：{task.due_date.strftime("%Y-%m-%d %H:%M") if task.due_date else "无"}\n\n请及时处理！'
            
            # 构建邮件内容，将在前端控制台显示
            email_content = {
                'subject': subject,
                'message': message,
                'from_email': settings.DEFAULT_FROM_EMAIL,
                'to_email': request.user.email or 'test@example.com'
            }
        except Exception as e:
            logger.error(f'构建邮件内容失败: {e}', exc_info=True)
            email_content = None
        
        # 处理进度节点
        progress_nodes = []
        if task.progress_nodes:
            progress_nodes = [node.strip() for node in task.progress_nodes.split('\n') if node.strip()]
        else:
            # 默认进度节点
            progress_nodes = ['待办', '进行中', '已完成']
        
        # 确定当前节点索引
        current_node_index = 0
        if task.status == 'in_progress' and len(progress_nodes) > 1:
            current_node_index = 1
        elif task.status == 'completed':
            current_node_index = len(progress_nodes) - 1
        
        # 添加到提醒列表
        reminders.append({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'due_date': task.due_date.strftime('%Y-%m-%d %H:%M') if task.due_date else None,
            'progress_nodes': progress_nodes,
            'current_node_index': current_node_index,
            'status': task.status,
            'email_content': email_content
        })
        
        # 处理任务周期
        if task.reminder_period == 'once':
            # 一次性提醒，标记为已提醒
            task.is_reminded = True
        else:
            # 重复提醒，更新下次提醒时间
            from datetime import timedelta
            if task.reminder_period == 'daily':
                # 每天提醒
                task.reminder_time += timedelta(days=1)
            elif task.reminder_period == 'weekly':
                # 每周提醒
                task.reminder_time += timedelta(weeks=1)
            elif task.reminder_period == 'monthly':
                # 每月提醒（简单处理，假设每个月30天）
                task.reminder_time += timedelta(days=30)
            elif task.reminder_period == 'yearly':
                # 每年提醒（简单处理，假设每年365天）
                task.reminder_time += timedelta(days=365)
            elif task.reminder_period == 'custom' and task.custom_reminder_days:
                # 自定义提醒
                try:
                    days = int(task.custom_reminder_days)
                    task.reminder_time += timedelta(days=days)
                except ValueError as e:
                    logger.warning(f'自定义提醒天数格式错误: {e}')
                    # 自定义提醒天数格式错误，标记为一次性提醒
                    task.is_reminded = True
            
            # 检查更新后的提醒时间是否超过截止时间
            if task.due_date and task.reminder_time > task.due_date:
                # 提醒时间超过截止时间，标记为已提醒，停止重复提醒
                task.is_reminded = True
        
        task.save()
    
    # 获取用户自定义音效（优先使用）或默认音效
    user_sound_url = None
    default_sound_url = '/static/videos/任务提醒音.mp3'
    try:
        if hasattr(request.user, 'userprofile') and request.user.userprofile.reminder_sound:
            user_sound_url = request.user.userprofile.reminder_sound.url
    except Exception as e:
        logger.warning(f'获取用户音效失败: {e}')

    # 如果是AJAX请求，返回JSON响应
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'has_reminders': has_reminders,
            'reminders': reminders,
            'user_sound_url': user_sound_url,
            'default_sound_url': default_sound_url
        })
    # 否则显示邮件发送结果
    from django.http import HttpResponse
    if reminders:
        message = f'已发送 {len(reminders)} 个任务提醒邮件到控制台\n\n'
        from django.utils.safestring import mark_safe
        for reminder in reminders:
            # 对用户输入进行HTML转义
            title = reminder["title"].replace('<', '&lt;').replace('>', '&gt;')
            description = (reminder["description"] or "无").replace('<', '&lt;').replace('>', '&gt;')
            due_date = reminder["due_date"] or "无"
            message += f'任务: {title}\n'
            message += f'描述: {description}\n'
            message += f'截止时间: {due_date}\n\n'
        message += '<a href="/task_list/">返回任务列表</a>'
        message = mark_safe(message)
        return HttpResponse(message)
    else:
        # 即使没有提醒任务，也显示状态信息
        from django.utils.safestring import mark_safe
        message = mark_safe('没有需要提醒的任务\n\n'
                          '邮件发送状态：已检查，无需要发送的邮件\n\n'
                          '<a href="/task_list/">返回任务列表</a>')
        return HttpResponse(message)

# 更新头像视图
@login_required
def update_avatar(request):
    from .forms import AvatarForm
    from PIL import Image
    import io
    
    if request.method == 'POST':
        form = AvatarForm(request.POST, request.FILES)
        if form.is_valid():
            avatar = form.cleaned_data['avatar']
            
            # 生成安全的文件名
            import uuid
            file_ext = os.path.splitext(avatar.name)[1].lower()
            new_filename = f"{uuid.uuid4()}{file_ext}"
            
            try:
                # 打开并处理图像
                img = Image.open(avatar)
                
                # 调整图像大小（保持比例）
                max_size = (200, 200)
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # 保存处理后的图像
                buffer = io.BytesIO()
                img_format = img.format or 'JPEG'
                img.save(buffer, format=img_format)
                buffer.seek(0)
                
                # 创建新的InMemoryFile
                from django.core.files.uploadedfile import InMemoryUploadedFile
                processed_avatar = InMemoryUploadedFile(
                    buffer,
                    None,
                    new_filename,
                    f'image/{img_format.lower()}',
                    buffer.getbuffer().nbytes,
                    None
                )
                
                # 保存到用户档案
                try:
                    user_profile = request.user.userprofile
                except User.userprofile.RelatedObjectDoesNotExist:
                    user_profile = UserProfile(user=request.user)
                
                user_profile.avatar = processed_avatar
                user_profile.save()
                
                # 返回AJAX响应
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': True,
                        'avatar_url': user_profile.avatar.url
                    })
                
            except Exception as e:
                logger.error(f'更新头像失败: {e}', exc_info=True)
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': False,
                        'error': '头像处理失败'
                    })
    
    # 非AJAX请求或失败时重定向
    return redirect('index')

# 设置页面视图
@login_required
def settings_view(request):
    from .forms import ReminderSoundForm
    if request.method == 'POST':
        form = ReminderSoundForm(request.POST, request.FILES)
        if form.is_valid():
            reminder_sound = form.cleaned_data['reminder_sound']
            # 生成安全的文件名
            import uuid
            file_ext = os.path.splitext(reminder_sound.name)[1].lower()
            new_filename = f"{uuid.uuid4()}{file_ext}"
            reminder_sound.name = new_filename
            
            try:
                user_profile = request.user.userprofile
            except User.userprofile.RelatedObjectDoesNotExist:
                user_profile = UserProfile(user=request.user)
            
            try:
                user_profile.reminder_sound = reminder_sound
                user_profile.save()
            except Exception as e:
                logger.error(f'更新提醒音效失败: {e}', exc_info=True)
    return render(request, 'set.html')

# 退出登录视图
def logout_view(request):
    logout(request)
    return redirect('index')

# 注销账号视图
@login_required
def delete_account(request):
    if request.method == 'POST':
        password = request.POST.get('password')
        
        # 验证密码
        if not request.user.check_password(password):
            return render(request, 'delete_account.html', {'error': '密码错误，请重新输入'})
        
        # 删除用户相关数据
        try:
            # 获取用户
            user = request.user
            
            # 删除用户的任务
            Task.objects.filter(user=user).delete()
            
            # 删除用户的会话
            UserSession.objects.filter(user=user).delete()
            
            # 删除用户的档案
            if hasattr(user, 'userprofile'):
                user.userprofile.delete()
            
            # 记录日志
            logger.info(f'用户 {user.username} 注销账号')
            
            # 退出登录
            logout(request)
            
            # 删除用户
            user.delete()
            
            # 重定向到首页
            return redirect('index')
        except Exception as e:
            logger.error(f'注销账号失败: {e}', exc_info=True)
            return render(request, 'delete_account.html', {'error': '注销失败，请稍后重试'})
    
    return render(request, 'delete_account.html')

# 切换账号视图
@login_required
def switch_account(request):
    if request.method == 'POST':
        # 处理直接切换账号的请求
        username = request.POST.get('username')
        if username:
            # 检查cookie是否有效（对用户名进行URL编码，避免CookieError）
            encoded_username = urllib.parse.quote(username)
            if f'user_{encoded_username}' in request.COOKIES and f'token_{encoded_username}' in request.COOKIES:
                # 尝试获取用户
                try:
                    user = User.objects.get(username=username)
                    # 登录该用户
                    login(request, user)
                    # 更新近期登录账号列表
                    recent_accounts = []
                    if 'recent_accounts' in request.session:
                        recent_accounts = request.session['recent_accounts']
                    # 移除已存在的相同账号
                    recent_accounts = [account for account in recent_accounts if account['username'] != username]
                    # 添加当前账号到列表开头
                    recent_accounts.insert(0, {'username': username})
                    # 只保留最近5个账号
                    recent_accounts = recent_accounts[:5]
                    # 更新session
                    request.session['recent_accounts'] = recent_accounts
                    # 延长cookie过期时间
                    response = redirect('index')
                    response.set_cookie(f'user_{encoded_username}', 'valid', max_age=7*24*60*60)
                    response.set_cookie(f'token_{encoded_username}', request.COOKIES.get(f'token_{encoded_username}'), max_age=7*24*60*60)
                    return response
                except User.DoesNotExist:
                    pass
            # 如果cookie无效或用户不存在，重定向到登录页面
            return redirect(f'{reverse("login")}?username={username}')
    
    # 获取近期登录过的账号
    recent_accounts = []
    
    # 从session中获取近期登录过的账号
    session_accounts = []
    if 'recent_accounts' in request.session:
        session_accounts = request.session['recent_accounts']
    
    # 从cookie中获取之前登录过的账号
    cookie_accounts = []
    for key in request.COOKIES:
        if key.startswith('user_'):
            # 提取并解码用户名（避免CookieError）
            encoded_username = key[5:]
            cookie_username = urllib.parse.unquote(encoded_username)
            cookie_accounts.append({'username': cookie_username})
    
    # 合并session和cookie中的账号信息，去重
    all_accounts = session_accounts + cookie_accounts
    unique_accounts = []
    seen_usernames = set()
    
    for account in all_accounts:
        if account['username'] not in seen_usernames:
            seen_usernames.add(account['username'])
            unique_accounts.append(account)
    
    # 检查账号是否存在，并添加到近期登录列表（排除当前登录的账号）
    current_user = request.user
    for account_data in unique_accounts:
        try:
            user = User.objects.get(username=account_data['username'])
            # 排除当前登录的账号
            if user.username != current_user.username:
                # 检查cookie是否过期（对用户名进行URL编码，避免CookieError）
                encoded_username = urllib.parse.quote(user.username)
                cookie_valid = f'user_{encoded_username}' in request.COOKIES
                recent_accounts.append({
                    'username': user.username,
                    'last_login': user.last_login,
                    'cookie_valid': cookie_valid
                })
        except User.DoesNotExist:
            pass
    
    # 更新session中的近期登录账号
    request.session['recent_accounts'] = [
        {'username': account['username']}
        for account in recent_accounts[:5]  # 只保留最近5个账号
    ]
    
    return render(request, 'switch_account.html', {'recent_accounts': recent_accounts})

# 任务详情视图
@login_required
def task_detail(request, task_id):
    if request.user.is_staff:
        task = get_object_or_404(Task, id=task_id)
    else:
        task = get_object_or_404(Task, id=task_id, user=request.user)
    now = timezone.now()
    
    # 处理标签
    tags = []
    if task.tags:
        # 如果是单个标签，直接添加到列表
        tags = [task.tags.strip()]
    
    # 处理进度节点
    progress_nodes = []
    if task.progress_nodes:
        progress_nodes = [node.strip() for node in task.progress_nodes.split('\n') if node.strip()]
    else:
        # 默认进度节点
        progress_nodes = ['待办', '进行中', '已完成']
    
    return render(request, 'task_reminder/task_detail.html', {
        'task': task,
        'now': now,
        'tags': tags,
        'progress_nodes': progress_nodes
    })

# 更新任务状态视图
@login_required
def update_task_status(request):
    from .forms import TaskStatusForm
    if request.method == 'POST':
        import json
        data = json.loads(request.body)
        form = TaskStatusForm(data)
        if form.is_valid():
            task_id = form.cleaned_data['task_id']
            status = form.cleaned_data['status']
            
            try:
                task = Task.objects.get(id=task_id, user=request.user)
                task.status = status
                task.save()
                return JsonResponse({'success': True})
            except Task.DoesNotExist:
                return JsonResponse({'success': False, 'error': '任务不存在'})
        else:
            return JsonResponse({'success': False, 'error': '表单验证失败'})
    return JsonResponse({'success': False, 'error': '无效的请求'})

# 获取用户活跃会话接口
@login_required
def get_user_sessions(request):
    if request.method == 'GET':
        # 获取当前用户的所有活跃会话
        sessions = UserSession.objects.filter(user=request.user, is_active=True)
        
        # 构建会话列表
        session_list = []
        for session in sessions:
            session_list.append({
                'id': session.id,
                'device_info': session.device_info,
                'created_at': session.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'last_activity': session.last_activity.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return JsonResponse({'success': True, 'sessions': session_list})
    return JsonResponse({'success': False, 'error': '无效的请求'})

# 终止会话接口
@login_required
def terminate_session(request, session_id):
    if request.method == 'POST':
        try:
            session = UserSession.objects.get(id=session_id, user=request.user)
            session.is_active = False
            session.save()
            return JsonResponse({'success': True})
        except UserSession.DoesNotExist:
            return JsonResponse({'success': False, 'error': '会话不存在'})
    return JsonResponse({'success': False, 'error': '无效的请求'})

# 获取指定日期的任务数据
@login_required
def get_tasks_by_date(request):
    from datetime import datetime
    from .forms import DateForm
    
    if request.method == 'GET':
        form = DateForm(request.GET)
        if form.is_valid():
            target_date = form.cleaned_data['date']
            
            # 处理时区问题，构建日期范围查询
            from datetime import timedelta
            start_date = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
            end_date = start_date + timedelta(days=1)
            
            # 使用日期范围查询，避免时区问题
            tasks = Task.objects.filter(user=request.user, due_date__gte=start_date, due_date__lt=end_date)
            
            task_list = []
            for task in tasks:
                task_list.append({
                    'id': task.id,
                    'title': task.title,
                    'description': task.description,
                    'due_date': task.due_date.strftime('%Y-%m-%d %H:%M') if task.due_date else None
                })
            
            return JsonResponse({'success': True, 'tasks': task_list})
        else:
            return JsonResponse({'success': False, 'error': '日期格式错误'})
    return JsonResponse({'success': False, 'error': '无效的请求'})

# 超级管理员视图
from django.contrib.admin.views.decorators import staff_member_required

@staff_member_required
def admin_dashboard(request):
    from datetime import datetime
    
    # 获取搜索参数
    search_query = request.GET.get('search', '')
    priority_filter = request.GET.get('priority', '')
    date_filter = request.GET.get('date', '')
    username_filter = request.GET.get('username', '')
    status_filter = request.GET.get('status', '')
    tags_filter = request.GET.get('tags', '')
    
    # 构建查询，获取所有用户的任务，预加载用户信息
    tasks = Task.objects.select_related('user')
    
    # 关键词搜索（标题和描述）
    if search_query:
        tasks = tasks.filter(
            models.Q(title__icontains=search_query) |
            models.Q(description__icontains=search_query)
        )
    
    # 优先级筛选
    if priority_filter:
        tasks = tasks.filter(priority=priority_filter)
    
    # 状态筛选
    if status_filter:
        tasks = tasks.filter(status=status_filter)
    
    # 用户名筛选
    if username_filter:
        tasks = tasks.filter(user__username__icontains=username_filter)
    
    # 日期筛选
    if date_filter:
        try:
            target_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
            
            # 处理时区问题，构建日期范围查询
            from datetime import timedelta
            start_date = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
            end_date = start_date + timedelta(days=1)
            
            # 使用日期范围查询，避免时区问题
            tasks = tasks.filter(created_at__gte=start_date, created_at__lt=end_date)
        except ValueError:
            pass
    
    # 标签筛选
    if tags_filter:
        tasks = tasks.filter(tags=tags_filter)
    
    # 排序：优先级从高到低，时间从早到晚，空截止日期排在最后
    tasks = tasks.order_by(
        models.Case(
            models.When(priority='high', then=0),
            models.When(priority='medium', then=1),
            models.When(priority='low', then=2),
            default=3
        ),
        models.Case(
            models.When(due_date__isnull=True, then=datetime.max),
            default=models.F('due_date')
        ),
        'created_at'
    )
    
    # 获取所有用户信息
    users = User.objects.all()
    
    return render(request, 'task_reminder/admin_dashboard.html', {
        'tasks': tasks,
        'users': users,
        'search_query': search_query,
        'priority_filter': priority_filter,
        'date_filter': date_filter,
        'username_filter': username_filter,
        'status_filter': status_filter,
        'tags_filter': tags_filter
    })

# 超级管理员用户管理视图
@staff_member_required
def admin_user_management(request):
    # 获取所有用户
    users = User.objects.all()
    return render(request, 'task_reminder/admin_user_management.html', {
        'users': users
    })

# 超级管理员注销其他用户账号视图
@staff_member_required
def admin_delete_user(request, user_id):
    if request.method == 'POST':
        try:
            # 获取要删除的用户
            user = User.objects.get(id=user_id)
            
            # 防止删除超级管理员自己
            if user == request.user:
                return render(request, 'task_reminder/admin_delete_user.html', {
                    'user': user,
                    'error': '不能删除您自己的账号'
                })
            
            # 删除用户相关数据
            # 删除用户的任务
            Task.objects.filter(user=user).delete()
            
            # 删除用户的会话
            UserSession.objects.filter(user=user).delete()
            
            # 删除用户的档案
            if hasattr(user, 'userprofile'):
                userprofile = user.userprofile
                userprofile.delete()
            
            # 记录日志
            logger.info(f'超级管理员 {request.user.username} 注销用户 {user.username}')
            
            # 删除用户
            user.delete()
            
            # 重定向到用户管理页面
            return redirect('admin_user_management')
        except User.DoesNotExist:
            return render(request, 'task_reminder/admin_delete_user.html', {
                'error': '用户不存在'
            })
        except Exception as e:
            logger.error(f'注销用户失败: {e}', exc_info=True)
            return render(request, 'task_reminder/admin_delete_user.html', {
                'error': '注销失败，请稍后重试'
            })
    
    try:
        user = User.objects.get(id=user_id)
        return render(request, 'task_reminder/admin_delete_user.html', {
            'user': user
        })
    except User.DoesNotExist:
        return render(request, 'task_reminder/admin_delete_user.html', {
            'error': '用户不存在'
        })

# 超级管理员统计视图
@staff_member_required
def admin_statistics_view(request):
    from datetime import datetime, timedelta
    
    # 获取所有用户和任务
    users = User.objects.all()
    tasks = Task.objects.all()
    
    # 基本统计
    total_users = users.count()
    total_tasks = tasks.count()
    completed_tasks = tasks.filter(status='completed').count()
    pending_tasks = tasks.filter(status='pending').count() + tasks.filter(status='in_progress').count()
    
    # 计算完成率
    if total_tasks > 0:
        completion_rate = round((completed_tasks / total_tasks * 100), 1)
        avg_completion_rate = completion_rate
    else:
        completion_rate = 0
        avg_completion_rate = 0
    
    # 用户任务分布数据
    user_task_data = {
        'labels': [],
        'data': []
    }
    for user in users:
        user_task_count = tasks.filter(user=user).count()
        if user_task_count > 0:
            user_task_data['labels'].append(user.username)
            user_task_data['data'].append(user_task_count)
    
    # 任务完成趋势（最近30天）
    today = timezone.now().date()
    completion_trend_labels = []
    completion_trend_data = []
    for i in range(29, -1, -1):
        date = today - timedelta(days=i)
        completion_trend_labels.append(date.strftime('%m-%d'))
        start_of_day = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        end_of_day = start_of_day + timedelta(days=1)
        count = tasks.filter(status='completed', created_at__gte=start_of_day, created_at__lt=end_of_day).count()
        completion_trend_data.append(count)
    
    completion_trend_data_dict = {
        'labels': completion_trend_labels,
        'data': completion_trend_data
    }
    
    # 状态分布数据
    status_data = {
        'pending': tasks.filter(status='pending').count(),
        'in_progress': tasks.filter(status='in_progress').count(),
        'completed': tasks.filter(status='completed').count()
    }
    
    # 优先级分布数据
    priority_data = {
        'high': tasks.filter(priority='high').count(),
        'medium': tasks.filter(priority='medium').count(),
        'low': tasks.filter(priority='low').count()
    }
    
    # 任务创建趋势（最近30天）
    trend_labels = []
    trend_data = []
    for i in range(29, -1, -1):
        date = today - timedelta(days=i)
        trend_labels.append(date.strftime('%m-%d'))
        start_of_day = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        end_of_day = start_of_day + timedelta(days=1)
        count = tasks.filter(created_at__gte=start_of_day, created_at__lt=end_of_day).count()
        trend_data.append(count)
    
    trend_data_dict = {
        'labels': trend_labels,
        'data': trend_data
    }
    
    # 标签分布数据
    tag_counts = {}
    for task in tasks:
        if task.tags:
            tags = [tag.strip() for tag in task.tags.split(',')]
            for tag in tags:
                if tag:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    # 只取前8个标签
    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    tag_data = {
        'labels': [tag[0] for tag in sorted_tags],
        'data': [tag[1] for tag in sorted_tags]
    }
    
    # 每日完成数（最近7天）
    daily_labels = []
    daily_data = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        daily_labels.append(date.strftime('%m-%d'))
        start_of_day = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        end_of_day = start_of_day + timedelta(days=1)
        count = tasks.filter(status='completed', created_at__gte=start_of_day, created_at__lt=end_of_day).count()
        daily_data.append(count)
    
    daily_data_dict = {
        'labels': daily_labels,
        'data': daily_data
    }
    
    context = {
        'total_users': total_users,
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'pending_tasks': pending_tasks,
        'completion_rate': completion_rate,
        'avg_completion_rate': avg_completion_rate,
        'user_task_data': json.dumps(user_task_data),
        'completion_trend_data': json.dumps(completion_trend_data_dict),
        'status_data': json.dumps(status_data),
        'priority_data': json.dumps(priority_data),
        'trend_data': json.dumps(trend_data_dict),
        'tag_data': json.dumps(tag_data),
        'daily_data': json.dumps(daily_data_dict)
    }
    
    return render(request, 'task_reminder/admin_statistics.html', context)

# 统计图表视图
@login_required
def statistics_view(request):
    from datetime import datetime, timedelta
    
    # 获取当前用户的所有任务
    tasks = Task.objects.filter(user=request.user)
    
    # 基本统计
    total_tasks = tasks.count()
    completed_tasks = tasks.filter(status='completed').count()
    pending_tasks = tasks.filter(status__in=['pending', 'in_progress']).count()
    completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0
    
    # 状态分布数据
    status_data = {
        'pending': tasks.filter(status='pending').count(),
        'in_progress': tasks.filter(status='in_progress').count(),
        'completed': tasks.filter(status='completed').count()
    }
    
    # 优先级分布数据
    priority_data = {
        'high': tasks.filter(priority='high').count(),
        'medium': tasks.filter(priority='medium').count(),
        'low': tasks.filter(priority='low').count()
    }
    
    # 任务创建趋势（最近30天）
    today = timezone.now().date()
    trend_labels = []
    trend_data = []
    for i in range(29, -1, -1):
        date = today - timedelta(days=i)
        trend_labels.append(date.strftime('%m-%d'))
        start_of_day = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        end_of_day = start_of_day + timedelta(days=1)
        count = tasks.filter(created_at__gte=start_of_day, created_at__lt=end_of_day).count()
        trend_data.append(count)
    
    trend_data_dict = {
        'labels': trend_labels,
        'data': trend_data
    }
    
    # 标签分布数据
    tag_counts = {}
    for task in tasks:
        if task.tags:
            tags = [tag.strip() for tag in task.tags.split(',')]
            for tag in tags:
                if tag:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    # 只取前8个标签
    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    tag_data = {
        'labels': [tag[0] for tag in sorted_tags],
        'data': [tag[1] for tag in sorted_tags]
    }
    
    # 每日完成数（最近7天）
    daily_labels = []
    daily_data = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        daily_labels.append(date.strftime('%m-%d'))
        # 由于Task模型没有updated_at字段，我们统计当天完成的任务数
        # 使用created_at作为参考，统计当天创建且已完成的状态
        start_of_day = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        end_of_day = start_of_day + timedelta(days=1)
        count = tasks.filter(status='completed', created_at__gte=start_of_day, created_at__lt=end_of_day).count()
        daily_data.append(count)
    
    daily_data_dict = {
        'labels': daily_labels,
        'data': daily_data
    }
    
    context = {
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'pending_tasks': pending_tasks,
        'completion_rate': completion_rate,
        'status_data': json.dumps(status_data),
        'priority_data': json.dumps(priority_data),
        'trend_data': json.dumps(trend_data_dict),
        'tag_data': json.dumps(tag_data),
        'daily_data': json.dumps(daily_data_dict)
    }
    
    return render(request, 'task_reminder/statistics.html', context)

# 数据导出视图
@login_required
def export_data(request):
    from datetime import datetime
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    
    export_format = request.GET.get('format', 'csv')
    status_filter = request.GET.get('status', '')
    
    # 构建查询
    tasks = Task.objects.filter(user=request.user)
    
    # 应用状态过滤
    if status_filter:
        tasks = tasks.filter(status=status_filter)
    
    try:
        if export_format == 'csv':
            # 导出为CSV
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['ID', '标题', '描述', '优先级', '状态', '截止时间', '提醒时间', '标签', '创建时间'])
            
            for task in tasks:
                writer.writerow([
                    task.id,
                    task.title,
                    task.description or '',
                    task.get_priority_display(),
                    task.get_status_display(),
                    task.due_date.strftime('%Y-%m-%d %H:%M') if task.due_date else '',
                    task.reminder_time.strftime('%Y-%m-%d %H:%M') if task.reminder_time else '',
                    task.tags or '',
                    task.created_at.strftime('%Y-%m-%d %H:%M')
                ])
            
            response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8-sig')
            response['Content-Disposition'] = f'attachment; filename="tasks_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
            return response
        
        elif export_format == 'json':
            # 导出为JSON
            data = []
            for task in tasks:
                data.append({
                    'id': task.id,
                    'title': task.title,
                    'description': task.description,
                    'priority': task.priority,
                    'status': task.status,
                    'due_date': task.due_date.strftime('%Y-%m-%d %H:%M') if task.due_date else None,
                    'reminder_time': task.reminder_time.strftime('%Y-%m-%d %H:%M') if task.reminder_time else None,
                    'tags': task.tags,
                    'created_at': task.created_at.strftime('%Y-%m-%d %H:%M')
                })
            
            response = HttpResponse(json.dumps(data, ensure_ascii=False, indent=2), content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="tasks_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json"'
            return response
        
        elif export_format == 'excel':
            # 导出为Excel
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "任务数据"
            
            # 设置表头样式
            header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
            header_font = Font(bold=True, color="FFFFFF")
            
            headers = ['ID', '标题', '描述', '优先级', '状态', '截止时间', '提醒时间', '标签', '创建时间']
            for col, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col, value=header)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal='center')
            
            # 写入数据
            for row, task in enumerate(tasks, 2):
                ws.cell(row=row, column=1, value=task.id)
                ws.cell(row=row, column=2, value=task.title)
                ws.cell(row=row, column=3, value=task.description or '')
                ws.cell(row=row, column=4, value=task.get_priority_display())
                ws.cell(row=row, column=5, value=task.get_status_display())
                ws.cell(row=row, column=6, value=task.due_date.strftime('%Y-%m-%d %H:%M') if task.due_date else '')
                ws.cell(row=row, column=7, value=task.reminder_time.strftime('%Y-%m-%d %H:%M') if task.reminder_time else '')
                ws.cell(row=row, column=8, value=task.tags or '')
                ws.cell(row=row, column=9, value=task.created_at.strftime('%Y-%m-%d %H:%M'))
            
            # 调整列宽
            ws.column_dimensions['A'].width = 8
            ws.column_dimensions['B'].width = 30
            ws.column_dimensions['C'].width = 40
            ws.column_dimensions['D'].width = 10
            ws.column_dimensions['E'].width = 10
            ws.column_dimensions['F'].width = 18
            ws.column_dimensions['G'].width = 18
            ws.column_dimensions['H'].width = 20
            ws.column_dimensions['I'].width = 18
            
            output = io.BytesIO()
            wb.save(output)
            output.seek(0)
            
            response = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="tasks_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx"'
            return response
    except Exception as e:
        logger.error(f'数据导出失败: {e}', exc_info=True)
        return redirect('statistics')
    
    return redirect('statistics')
