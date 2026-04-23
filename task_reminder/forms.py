from django import forms
from django.contrib.auth.models import User
from .models import Task, UserProfile
import os

class RegisterForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '用户名'})
    )
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': '邮箱'})
    )
    password1 = forms.CharField(
        required=True,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': '密码'})
    )
    password2 = forms.CharField(
        required=True,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': '确认密码'})
    )
    
    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError('用户名已存在')
        return username
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('邮箱已被注册')
        return email
    
    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('两次密码输入不一致')
        return cleaned_data

class LoginForm(forms.Form):
    username = forms.CharField(
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '用户名'})
    )
    password = forms.CharField(
        required=True,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': '密码'})
    )

class TaskForm(forms.ModelForm):
    # 为 progress_nodes 添加自定义字段，使用 CharField 而不是 JSONField
    progress_nodes = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'placeholder': '进度节点，每行一个', 'rows': 4}),
        required=False
    )
    
    class Meta:
        model = Task
        fields = ['title', 'description', 'priority', 'due_date', 'reminder_time', 'reminder_period', 'custom_reminder_days', 'tags', 'progress_nodes']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '任务标题'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'placeholder': '任务描述', 'rows': 3}),
            'priority': forms.Select(attrs={'class': 'form-control'}),
            'due_date': forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
            'reminder_time': forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
            'reminder_period': forms.Select(attrs={'class': 'form-control'}),
            'custom_reminder_days': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '自定义提醒天数'}),
            'tags': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '标签，用逗号分隔'})
        }
    
    def clean_title(self):
        title = self.cleaned_data.get('title')
        if not title or len(title.strip()) == 0:
            raise forms.ValidationError('任务标题不能为空')
        return title.strip()
    
    def clean_tags(self):
        tags = self.cleaned_data.get('tags')
        if tags:
            # 清理标签，去除空格
            tags_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            return ','.join(tags_list)
        return tags
    
    def clean_progress_nodes(self):
        progress_nodes = self.cleaned_data.get('progress_nodes')
        if progress_nodes:
            # 清理进度节点，去除空行和空格，转换为列表
            nodes_list = [node.strip() for node in progress_nodes.split('\n') if node.strip()]
            return nodes_list
        return []
    
    def save(self, commit=True):
        # 调用父类的 save 方法
        task = super().save(commit=False)
        
        # 确保 progress_nodes 是列表格式
        if isinstance(task.progress_nodes, str):
            # 如果是字符串，转换为列表
            nodes_list = [node.strip() for node in task.progress_nodes.split('\n') if node.strip()]
            task.progress_nodes = nodes_list
        elif not isinstance(task.progress_nodes, list):
            # 如果不是列表，设置为空列表
            task.progress_nodes = []
        
        if commit:
            task.save()
        return task
    
    def clean(self):
        cleaned_data = super().clean()
        reminder_time = cleaned_data.get('reminder_time')
        due_date = cleaned_data.get('due_date')
        
        if reminder_time and due_date and reminder_time > due_date:
            raise forms.ValidationError('提醒时间不能晚于截止时间')
        
        return cleaned_data

class AvatarForm(forms.Form):
    avatar = forms.ImageField(
        required=True,
        widget=forms.FileInput(attrs={'class': 'form-control-file'})
    )
    
    def clean_avatar(self):
        avatar = self.cleaned_data.get('avatar')
        if avatar:
            # 验证文件类型
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            file_ext = os.path.splitext(avatar.name)[1].lower()
            
            # 验证文件大小（限制为5MB）
            max_size = 5 * 1024 * 1024  # 5MB
            
            if file_ext not in allowed_extensions:
                raise forms.ValidationError('只允许上传图片文件（jpg, jpeg, png, gif, webp）')
            elif avatar.size > max_size:
                raise forms.ValidationError('文件大小不能超过5MB')
        return avatar

class ReminderSoundForm(forms.Form):
    reminder_sound = forms.FileField(
        required=True,
        widget=forms.FileInput(attrs={'class': 'form-control-file'})
    )
    
    def clean_reminder_sound(self):
        reminder_sound = self.cleaned_data.get('reminder_sound')
        if reminder_sound:
            # 验证文件类型
            allowed_extensions = ['.mp3', '.wav', '.ogg', '.m4a']
            file_ext = os.path.splitext(reminder_sound.name)[1].lower()
            
            # 验证文件大小（限制为10MB）
            max_size = 10 * 1024 * 1024  # 10MB
            
            if file_ext not in allowed_extensions:
                raise forms.ValidationError('只允许上传音频文件（mp3, wav, ogg, m4a）')
            elif reminder_sound.size > max_size:
                raise forms.ValidationError('文件大小不能超过10MB')
        return reminder_sound

class TaskStatusForm(forms.Form):
    task_id = forms.IntegerField(required=True)
    status = forms.ChoiceField(
        required=True,
        choices=[('pending', '待办'), ('in_progress', '进行中'), ('completed', '已完成')]
    )

class DateForm(forms.Form):
    date = forms.DateField(
        required=True,
        widget=forms.DateInput(attrs={'type': 'date'})
    )
