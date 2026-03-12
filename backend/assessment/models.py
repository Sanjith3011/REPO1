from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    ROLE_CHOICES = [('admin', 'Admin'), ('teacher', 'Teacher'), ('student', 'Student')]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='teacher')
    department = models.ForeignKey(
        'Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='users'
    )
    student_profile = models.ForeignKey(
        'Student', on_delete=models.SET_NULL, null=True, blank=True, related_name='user_accounts'
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.name


class Batch(models.Model):
    year_start = models.IntegerField()
    year_end = models.IntegerField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='batches')

    class Meta:
        unique_together = ('year_start', 'year_end', 'department')

    def __str__(self):
        return f"{self.year_start}–{self.year_end} ({self.department.code})"


class Subject(models.Model):
    SEMESTER_CHOICES = [(i, f'Semester {i}') for i in range(1, 9)]
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='subjects')
    semester = models.IntegerField(choices=SEMESTER_CHOICES)
    staff_name = models.CharField(max_length=100, blank=True, default='')
    teacher = models.ForeignKey(
        'CustomUser', on_delete=models.SET_NULL, null=True, blank=True,
        limit_choices_to={'role': 'teacher'}, related_name='assigned_subjects'
    )
    assigned_students = models.ManyToManyField(
        'Student', blank=True, related_name='elective_subjects',
        help_text="Select specific students taking this subject. If left empty, all students in the matching Batch/Dept/Year will be considered enrolled."
    )
    
    class Meta:
        unique_together = ('code', 'department', 'semester')

    def __str__(self):
        return f"{self.code} - {self.name}"


class Student(models.Model):
    YEAR_CHOICES = [('I', 'I'), ('II', 'II'), ('III', 'III'), ('IV', 'IV')]
    name = models.CharField(max_length=150)
    roll_no = models.CharField(max_length=30)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='students')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='students')
    year = models.CharField(max_length=5, choices=YEAR_CHOICES)

    class Meta:
        unique_together = ('roll_no', 'year', 'batch', 'department')

    def __str__(self):
        return f"{self.roll_no} - {self.name}"


class Mark(models.Model):
    ASSESSMENT_CHOICES = [
        ('CT1', 'Class Test 1'),
        ('CT2', 'Class Test 2'),
        ('CT3', 'Class Test 3'),
        ('CAT1', 'CAT 1'),
        ('CAT2', 'CAT 2'),
    ]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='marks')
    assessment_type = models.CharField(max_length=10, choices=ASSESSMENT_CHOICES)
    marks = models.FloatField(null=True, blank=True)  # null = Absent
    is_absent = models.BooleanField(default=False)
    entered_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'subject', 'assessment_type')

    @property
    def max_marks(self):
        if self.assessment_type.startswith('CT'):
            return 30   # Unit Test: max 30, pass 15
        return 100      # CAT: max 100, pass 50

    @property
    def is_pass(self):
        if self.is_absent or self.marks is None:
            return False
        pass_mark = self.max_marks * 0.5
        return self.marks >= pass_mark

    def __str__(self):
        val = 'AB' if self.is_absent else str(self.marks)
        return f"{self.student.roll_no} | {self.subject.code} | {self.assessment_type} = {val}"
