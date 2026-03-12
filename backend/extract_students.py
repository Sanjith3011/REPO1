import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assessment.models import Student

students = Student.objects.filter(batch__year_start=2024, batch__year_end=2028).order_by('roll_no')
result = []
for s in students:
    result.append(f"{s.roll_no} - {s.name}")

print("\n".join(result))
