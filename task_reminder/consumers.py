import json
import asyncio
import logging
from django.utils import timezone
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

# 延迟导入模型以避免AppRegistryNotReady错误
User = None
Task = None
priority_to_int = None

logger = logging.getLogger(__name__)

class ReminderConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 延迟导入模型和函数
        global User, Task, priority_to_int
        if User is None:
            from django.contrib.auth.models import User
        if Task is None:
            from .models import Task
        if priority_to_int is None:
            from .views import priority_to_int

    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # 接受连接
        await self.accept()
        logger.info(f'用户 {self.user.username} 连接到提醒WebSocket')
        
        # 开始检查提醒的任务
        self.task = asyncio.create_task(self.check_reminders())
    
    async def disconnect(self, close_code):
        # 取消检查提醒的任务
        if hasattr(self, 'task'):
            self.task.cancel()
        logger.info(f'用户 {self.user.username} 断开提醒WebSocket连接')
    
    async def check_reminders(self):
        """定期检查任务提醒"""
        try:
            while True:
                await asyncio.sleep(5)  # 每5秒检查一次
                
                # 查询需要提醒的任务
                now = timezone.now()
                
                @sync_to_async
                def get_reminder_tasks(user, now):
                    return list(Task.objects.filter(
                        user=user,
                        reminder_time__lte=now,
                        is_reminded=False
                    ))
                
                tasks = await get_reminder_tasks(self.user, now)
                
                if tasks:
                    # 处理提醒
                    await self.send_reminders(tasks)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f'检查提醒时出错: {e}', exc_info=True)
    
    async def send_reminders(self, tasks):
        """发送提醒到客户端"""
        # 排序任务
        tasks_list = list(tasks)
        tasks_list.sort(key=lambda task: (
            priority_to_int(task.priority),
            task.due_date or timezone.make_aware(timezone.datetime.max),
            task.created_at
        ))
        
        # 构建提醒数据
        reminders = []
        
        @sync_to_async
        def update_task(task):
            """更新任务状态和提醒时间"""
            from datetime import timedelta
            
            # 处理任务周期
            if task.reminder_period == 'once':
                task.is_reminded = True
            else:
                if task.reminder_period == 'daily':
                    task.reminder_time += timedelta(days=1)
                elif task.reminder_period == 'weekly':
                    task.reminder_time += timedelta(weeks=1)
                elif task.reminder_period == 'monthly':
                    task.reminder_time += timedelta(days=30)
                elif task.reminder_period == 'yearly':
                    task.reminder_time += timedelta(days=365)
                elif task.reminder_period == 'custom' and task.custom_reminder_days:
                    try:
                        days = int(task.custom_reminder_days)
                        task.reminder_time += timedelta(days=days)
                    except ValueError:
                        task.is_reminded = True
                
                if task.due_date and task.reminder_time > task.due_date:
                    task.is_reminded = True
            
            task.save()
            return task
        
        for task in tasks_list:
            # 处理进度节点
            progress_nodes = []
            if task.progress_nodes:
                progress_nodes = [node.strip() for node in task.progress_nodes.split('\n') if node.strip()]
            else:
                progress_nodes = ['待办', '进行中', '已完成']
            
            # 确定当前节点索引
            current_node_index = 0
            if task.status == 'in_progress' and len(progress_nodes) > 1:
                current_node_index = 1
            elif task.status == 'completed':
                current_node_index = len(progress_nodes) - 1
            
            # 构建邮件内容
            try:
                subject = f'任务提醒：{task.title}'
                message = f'您好！\n\n您有一个任务需要处理：\n\n任务标题：{task.title}\n任务描述：{task.description or "无"}\n截止时间：{task.due_date.strftime("%Y-%m-%d %H:%M") if task.due_date else "无"}\n\n请及时处理！'
                
                email_content = {
                    'subject': subject,
                    'message': message,
                    'from_email': 'noreply@notmatters.com',
                    'to_email': self.user.email or 'test@example.com'
                }
            except Exception as e:
                logger.error(f'构建邮件内容失败: {e}')
                email_content = None
            
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
            
            # 异步更新任务
            await update_task(task)
        
        # 获取用户音效
        user_sound_url = None
        default_sound_url = '/static/videos/任务提醒音.mp3'
        
        @sync_to_async
        def get_user_sound_url(user):
            """获取用户自定义音效URL"""
            try:
                if hasattr(user, 'userprofile') and user.userprofile.reminder_sound:
                    return user.userprofile.reminder_sound.url
            except Exception as e:
                logger.warning(f'获取用户音效失败: {e}')
            return None
        
        user_sound_url = await get_user_sound_url(self.user)
        
        # 发送提醒数据
        await self.send(text_data=json.dumps({
            'reminders': reminders,
            'user_sound_url': user_sound_url,
            'default_sound_url': default_sound_url
        }))
    
    async def receive(self, text_data):
        """处理从客户端收到的消息"""
        try:
            data = json.loads(text_data)
            # 这里可以处理客户端发送的消息，例如确认收到提醒
            if data.get('type') == 'ack':
                logger.info(f'收到用户 {self.user.username} 的提醒确认')
        except json.JSONDecodeError as e:
            logger.error(f'解析WebSocket消息失败: {e}')