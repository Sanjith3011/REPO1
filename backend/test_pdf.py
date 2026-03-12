import os, django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from assessment.models import Student, Subject, Batch, Department
from assessment.views import _compute_summary
from assessment.pdf_generator import generate_marks_pdf

# Find a valid combination
s = Student.objects.first()
if s:
    batch = s.batch
    dept = s.department
    year = s.year
    sem = 1 # Assume sem 1
    
    students_qs = Student.objects.filter(batch=batch, department=dept, year=year).order_by('roll_no')
    subjects_qs = Subject.objects.filter(department=dept, semester=sem).order_by('code')
    
    if list(subjects_qs):
        student_rows, subject_summary, class_summary = _compute_summary(students_qs, subjects_qs, 'CT1')
        
        context = {
            'department': dept.name,
            'batch': f"{batch.year_start}–{batch.year_end}",
            'year': year,
            'semester': sem,
            'assessment_type': 'CT1',
            'subjects': [{'code': s.code, 'name': s.name, 'staff_name': s.staff_name} for s in subjects_qs],
            'students': student_rows,
            'subject_summary': subject_summary,
            'class_summary': class_summary,
        }
        
        pdf_buffer = generate_marks_pdf(context)
        with open('test_report.pdf', 'wb') as f:
            f.write(pdf_buffer.read())
        print(f"Successfully generated PDF: test_report.pdf with {len(student_rows)} students and {len(subjects_qs)} subjects.")
    else:
        print("No subjects found for testing.")
else:
    print("No students found.")
