from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# 扩展User模型，添加头像字段
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    reminder_sound = models.FileField(upload_to='sounds/', blank=True, null=True)
    
    def __str__(self):
        return self.user.username

# 会话模型，用于存储用户的登录会话信息
class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    device_info = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.device_info}"

# 当用户创建时，自动创建UserProfile
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

# 当用户保存时，自动保存UserProfile
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.userprofile.save()
    except User.userprofile.RelatedObjectDoesNotExist:
        UserProfile.objects.create(user=instance)

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', '待办'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
    ]
    
    REMINDER_PERIOD_CHOICES = [
        ('once', '一次性'),
        ('daily', '每天'),
        ('weekly', '每周'),
        ('monthly', '每月'),
        ('yearly', '每年'),
        ('custom', '自定义'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户', null=True)
    title = models.CharField(max_length=200, verbose_name='标题')
    description = models.TextField(blank=True, null=True, verbose_name='描述')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name='优先级')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    due_date = models.DateTimeField(blank=True, null=True, verbose_name='截止时间')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    reminder_time = models.DateTimeField(blank=True, null=True, verbose_name='提醒时间')
    reminder_period = models.CharField(max_length=20, choices=REMINDER_PERIOD_CHOICES, default='once', verbose_name='提醒周期')
    custom_reminder_days = models.CharField(max_length=50, blank=True, null=True, verbose_name='自定义提醒天数')
    is_reminded = models.BooleanField(default=False, verbose_name='是否已提醒')
    tags = models.CharField(max_length=200, blank=True, null=True, verbose_name='标签')
    progress_nodes = models.JSONField(blank=True, null=False, default=list, verbose_name='进度节点')
    progress_status = models.JSONField(blank=True, null=False, default=list, verbose_name='进度节点状态')
    progress_percentage = models.IntegerField(default=0, verbose_name='进度百分比')
    
    def __str__(self):
        return self.title
    
    class Meta:
        verbose_name = '任务'
        verbose_name_plural = '任务管理'
        indexes = [
            models.Index(fields=['user'], name='idx_task_user'),
            models.Index(fields=['user', 'priority'], name='idx_task_user_priority'),
            models.Index(fields=['user', 'due_date'], name='idx_task_user_due_date'),
            models.Index(fields=['user', 'status'], name='idx_task_user_status'),
            models.Index(fields=['reminder_time', 'is_reminded'], name='idx_task_reminder'),
            models.Index(fields=['created_at'], name='idx_task_created_at'),
        ]

