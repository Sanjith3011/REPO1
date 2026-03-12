import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assessment.models import Student, CustomUser

for s in Student.objects.all():
    print(f"[{s.name}] [{s.roll_no}]")
    users = CustomUser.objects.filter(username=s.roll_no, role='student')
    print("User exists:", users.exists(), "Active:", users.first().is_active if users.exists() else False)
