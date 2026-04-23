from django import template
import json

register = template.Library()

@register.filter(name='is_list')
def is_list(value):
    return isinstance(value, list)

@register.filter(name='to_json')
def to_json(value):
    return json.dumps(value)
