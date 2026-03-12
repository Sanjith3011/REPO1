import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assessment.serializers import UserCreateSerializer
from assessment.models import CustomUser

serializer = UserCreateSerializer(data={'username': 'teacher3', 'first_name': 'T3', 'password': 'pass123', 'role': 'teacher'})
if serializer.is_valid():
    u = serializer.save()
    print("Created teacher3.")
    print("Check pass123:", u.check_password('pass123'))
else:
    print("Errors:", serializer.errors)
