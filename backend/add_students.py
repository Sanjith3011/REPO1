import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from assessment.models import Student, Department, Batch

cse = Department.objects.get(code='CSE')
batch = Batch.objects.get(year_start=2024, year_end=2028, department=cse)

students_data = [
    ('711224104048', 'Nishanth Priyan P', 'II'),
    ('711224104049', 'Palani M', 'II'),
]

for roll_no, name, year in students_data:
    st, created = Student.objects.get_or_create(
        roll_no=roll_no,
        defaults={'name': name, 'batch': batch, 'department': cse, 'year': year}
    )
    status = 'Created' if created else 'Already exists'
    print(f'  {status}: {roll_no} - {name} (Year {year})')

print('Total students now:', Student.objects.count())
