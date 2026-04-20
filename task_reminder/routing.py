from django.urls import path
from .consumers import ReminderConsumer

websocket_urlpatterns = [
    path('ws/reminders/', ReminderConsumer.as_asgi()),
]