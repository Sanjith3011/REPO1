from django.http import HttpResponse, JsonResponse
import os
from django.db import transaction
from rest_framework import status, serializers, exceptions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser, Department, Batch, Subject, Student, Mark
from .serializers import (
    UserSerializer, DepartmentSerializer, BatchSerializer,
    SubjectSerializer, StudentSerializer, MarkSerializer, UserCreateSerializer
)
from .permissions import IsTeacher, IsStudent, IsAdmin
from .pdf_generator import generate_marks_pdf


# ──────────────────────────────
# Custom JWT login — adds role to token
# ──────────────────────────────
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password'].required = False
        self.fields['role'] = serializers.CharField(required=False)
        self.fields['name'] = serializers.CharField(required=False)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        role = attrs.get('role')
        if role == 'student':
            username = attrs.get(self.username_field)
            name = attrs.get('name')
            
            if not username or not name:
                raise exceptions.AuthenticationFailed('Register number and Name are required.')
                
            try:
                # Find matching student (case-insensitive) - uses .filter().first() to support multiple year records
                student = Student.objects.filter(roll_no__iexact=username, name__iexact=name).first()
                if not student:
                    raise Student.DoesNotExist
                # Fetch matching user profile
                user = CustomUser.objects.get(username=student.roll_no, role='student')
            except (Student.DoesNotExist, CustomUser.DoesNotExist):
                raise exceptions.AuthenticationFailed('No active student found with the given Name and Register Number')

            if not user.is_active:
                raise exceptions.AuthenticationFailed('This account is inactive.', code='user_inactive')

            self.user = user
            refresh = self.get_token(self.user)
            
            data = {}
            data['refresh'] = str(refresh)
            data['access'] = str(refresh.access_token)
            data['role'] = self.user.role
            data['user_id'] = self.user.id
            data['username'] = self.user.username
            return data

        # Default authentication for staff/admins
        if not attrs.get('password'):
            raise exceptions.ValidationError({'password': 'Password is required'})
            
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['user_id'] = self.user.id
        data['username'] = self.user.username
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ──────────────────────────────
# Auth
# ──────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_own_password(request):
    """Allow any logged-in user to change their own password"""
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not old_password or not new_password:
        return Response({'error': 'Old and new passwords are required'}, status=400)

    user = request.user
    if not user.check_password(old_password):
        return Response({'error': 'Incorrect old password'}, status=400)

    user.set_password(new_password)
    user.save()
    return Response({'message': 'Password changed successfully'})


# ──────────────────────────────
# Departments
# ──────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def department_list(request):
    departments = Department.objects.all().order_by('name')
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)


# ──────────────────────────────
# Teachers (Admin only)
# ──────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdmin])
def teacher_list(request):
    teachers = CustomUser.objects.filter(role='teacher').order_by('first_name', 'username')
    serializer = UserSerializer(teachers, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def teacher_create(request):
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def teacher_delete(request, teacher_id):
    """Delete a teacher account — Admin only"""
    try:
        teacher = CustomUser.objects.get(id=teacher_id, role='teacher')
    except CustomUser.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=404)

    username = teacher.username
    teacher.delete()
    return Response({'message': f'Teacher {username} deleted successfully'})


@api_view(['PATCH', 'PUT'])
@permission_classes([IsAdmin])
def teacher_update(request, teacher_id):
    """Edit teacher details (username, first_name, last_name) — Admin only"""
    try:
        teacher = CustomUser.objects.get(id=teacher_id, role='teacher')
    except CustomUser.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=404)

    username = request.data.get('username')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')

    if username and username != teacher.username:
        if CustomUser.objects.filter(username=username).exists():
            return Response({'error': 'A user with that username already exists.'}, status=400)
        teacher.username = username

    if first_name is not None:
        teacher.first_name = first_name
    if last_name is not None:
        teacher.last_name = last_name

    teacher.save()
    
    # Return updated user data
    serializer = UserSerializer(teacher)
    return Response(serializer.data, status=200)


@api_view(['POST'])
@permission_classes([IsAdmin])
def teacher_change_password(request, teacher_id):
    """Allow an admin to forcefully reset a teacher's password"""
    new_password = request.data.get('new_password')
    if not new_password:
        return Response({'error': 'New password is required'}, status=400)

    try:
        teacher = CustomUser.objects.get(id=teacher_id, role='teacher')
    except CustomUser.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=404)

    teacher.set_password(new_password)
    teacher.save()
    return Response({'message': f'Password updated for {teacher.username}'})


# ──────────────────────────────
# Batches
# ──────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def batch_list(request):
    dept_id = request.query_params.get('department')
    batches = Batch.objects.all().order_by('-year_start')
    if dept_id:
        batches = batches.filter(department_id=dept_id)
    serializer = BatchSerializer(batches, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def batch_create(request):
    year_start = request.data.get('year_start')
    year_end = request.data.get('year_end')
    department_id = request.data.get('department_id')

    if not year_start or not year_end or not department_id:
        return Response({'error': 'year_start, year_end, and department_id are required'}, status=400)

    try:
        year_start = int(year_start)
        year_end = int(year_end)
    except ValueError:
        return Response({'error': 'year_start and year_end must be integers'}, status=400)

    try:
        department = Department.objects.get(id=department_id)
    except Department.DoesNotExist:
        return Response({'error': 'Department not found'}, status=404)

    if Batch.objects.filter(year_start=year_start, year_end=year_end, department=department).exists():
        return Response({'error': 'This batch already exists for this department.'}, status=400)

    batch = Batch.objects.create(year_start=year_start, year_end=year_end, department=department)
    serializer = BatchSerializer(batch)
    return Response(serializer.data, status=201)


# ──────────────────────────────
# Subjects
# ──────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subject_list(request):
    dept_id = request.query_params.get('department')
    sem = request.query_params.get('semester')
    subjects = Subject.objects.all().order_by('code')
    if dept_id:
        subjects = subjects.filter(department_id=dept_id)
    if sem:
        subjects = subjects.filter(semester=sem)
        
    # If the user is a teacher, strictly filter subjects assigned to them
    if request.user.role == 'teacher':
        subjects = subjects.filter(teacher=request.user)
        
    serializer = SubjectSerializer(subjects, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def subject_create(request):
    """Create a new subject — Admin only"""
    code = request.data.get('code', '').strip().upper()
    name = request.data.get('name', '').strip()
    dept_id = request.data.get('department_id')
    semester = request.data.get('semester')
    staff_name = request.data.get('staff_name', '').strip()

    if not all([code, name, dept_id, semester]):
        return Response({'error': 'code, name, department_id, semester are required'}, status=400)

    try:
        dept = Department.objects.get(id=dept_id)
    except Department.DoesNotExist:
        return Response({'error': 'Invalid department'}, status=404)

    if Subject.objects.filter(code=code, department=dept, semester=semester).exists():
        return Response({'error': f'Subject {code} already exists for this department and semester'}, status=400)

    subject = Subject.objects.create(
        code=code, name=name, department=dept, semester=int(semester), staff_name=staff_name
    )
    return Response(SubjectSerializer(subject).data, status=201)


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def subject_delete(request, subject_id):
    """Delete a subject and all related marks — Admin only"""
    try:
        subject = Subject.objects.get(id=subject_id)
    except Subject.DoesNotExist:
        return Response({'error': 'Subject not found'}, status=404)

    code = subject.code
    name = subject.name
    Mark.objects.filter(subject=subject).delete()
    subject.delete()
    return Response({'message': f'{code} - {name} deleted successfully'})


@api_view(['PATCH'])
@permission_classes([IsAdmin])
def subject_assign(request, subject_id):
    """Assign a teacher to a subject — Admin only"""
    try:
        subject = Subject.objects.get(id=subject_id)
    except Subject.DoesNotExist:
        return Response({'error': 'Subject not found'}, status=404)
        
    teacher_id = request.data.get('teacher_id')
    if teacher_id:
        try:
            teacher = CustomUser.objects.get(id=teacher_id, role='teacher')
            subject.teacher = teacher
        except CustomUser.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=404)
    else:
        # Unassign
        subject.teacher = None
        
    subject.save()
    return Response(SubjectSerializer(subject).data)

@api_view(['POST'])
@permission_classes([IsAdmin])
def subject_assign_students(request, subject_id):
    """Assign a specific list of students to a subject (Elective mapping) - Admin only"""
    try:
        subject = Subject.objects.get(id=subject_id)
    except Subject.DoesNotExist:
        return Response({'error': 'Subject not found'}, status=404)
        
    student_ids = request.data.get('student_ids', [])
    if not isinstance(student_ids, list):
        return Response({'error': 'student_ids must be a list of IDs'}, status=400)
        
    # Verify all students exist and belong to the same department (optional but good practice)
    students = Student.objects.filter(id__in=student_ids)
    if len(students) != len(student_ids):
        # Some IDs were invalid
        pass # Or handle strictly
        
    # Update the ManyToMany mapping
    subject.assigned_students.set(students)
    
    # Pre-fetch for the serializer response to be accurate
    subject = Subject.objects.prefetch_related('assigned_students').get(id=subject_id)
    return Response(SubjectSerializer(subject).data)


@api_view(['PATCH', 'PUT'])
@permission_classes([IsAdmin])
def subject_update(request, subject_id):
    """Update a Subject's code, name, and staff_name — Admin only"""
    try:
        subject = Subject.objects.get(id=subject_id)
    except Subject.DoesNotExist:
        return Response({'error': 'Subject not found'}, status=404)
        
    code = request.data.get('code', subject.code).strip().upper()
    name = request.data.get('name', subject.name).strip()
    staff_name = request.data.get('staff_name', subject.staff_name).strip()
    
    if not code or not name:
        return Response({'error': 'Subject code and name cannot be empty'}, status=400)
    
    # Check for duplicate code in the same department/semester, excluding this subject
    if Subject.objects.filter(code=code, department=subject.department, semester=subject.semester).exclude(id=subject.id).exists():
        return Response({'error': f'Another subject with code {code} already exists for this department and semester'}, status=400)
        
    subject.code = code
    subject.name = name
    subject.staff_name = staff_name
    subject.save()
    
    return Response(SubjectSerializer(subject).data)


# ──────────────────────────────
# Students
# ──────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_list(request):
    batch_id = request.query_params.get('batch')
    dept_id = request.query_params.get('department')
    year = request.query_params.get('year')

    students = Student.objects.all().order_by('roll_no')
    if batch_id:
        students = students.filter(batch_id=batch_id)
    if dept_id:
        students = students.filter(department_id=dept_id)
    if year:
        students = students.filter(year=year)

    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def student_create(request):
    """Create a new student entry (unique per year) and manage user account — Admin only"""
    roll_no = request.data.get('roll_no', '').strip()
    name = request.data.get('name', '').strip()
    batch_id = request.data.get('batch_id')
    dept_id = request.data.get('department_id')
    year = request.data.get('year')

    if not all([roll_no, name, batch_id, dept_id, year]):
        return Response({'error': 'roll_no, name, batch_id, department_id, year are required'}, status=400)

    try:
        batch = Batch.objects.get(id=batch_id)
        dept = Department.objects.get(id=dept_id)
    except (Batch.DoesNotExist, Department.DoesNotExist):
        return Response({'error': 'Invalid batch or department'}, status=404)

    # Check if THIS SPECIFIC year entry already exists
    if Student.objects.filter(roll_no=roll_no, year=year, batch=batch, department=dept).exists():
        return Response({'error': f'Student with roll no {roll_no} already exists for Year {year}'}, status=400)

    # Create the new Student record (Separate year record)
    student = Student.objects.create(
        roll_no=roll_no,
        name=name,
        batch=batch,
        department=dept,
        year=year,
    )
    
    # Handle user account
    user = CustomUser.objects.filter(username=roll_no).first()
    if user:
        # Existing user, just update their active profile and name if necessary
        user.first_name = name
        user.student_profile = student
        user.save()
    else:
        # Create new matching user account
        password = request.data.get('password', roll_no) # defaults to roll_no
        user = CustomUser.objects.create_user(
            username=roll_no,
            password=password,
            first_name=name,
            role='student',
            student_profile=student,
            department=dept
        )
    
    return Response(StudentSerializer(student).data, status=201)


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def student_delete(request, student_id):
    """Delete a student — Admin only. Deletes user account only if it's the last profile."""
    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)

    name = student.name
    roll_no = student.roll_no
    
    # Check if this is the last profile for this roll number
    other_profiles = Student.objects.filter(roll_no=roll_no).exclude(id=student_id)
    
    if not other_profiles.exists():
        # Last profile: delete the user account
        CustomUser.objects.filter(username=roll_no).delete()
    else:
        # Not the last profile: just ensure the user account doesn't point to this dead profile
        user = CustomUser.objects.filter(username=roll_no).first()
        if user and user.student_profile_id == student_id:
            user.student_profile = other_profiles.first()
            user.save()
            
    Mark.objects.filter(student=student).delete()
    student.delete()
    return Response({'message': f'{name} ({roll_no}) deleted successfully'})


@api_view(['POST'])
@permission_classes([IsAdmin])
def student_bulk_delete(request):
    """Bulk delete students — Admin only. Account-safe."""
    student_ids = request.data.get('student_ids', [])
    if not student_ids:
        return Response({'error': 'No student IDs provided'}, status=400)
    
    count = 0
    with transaction.atomic():
        students = Student.objects.filter(id__in=student_ids)
        roll_nos_to_check = set(students.values_list('roll_no', flat=True))
        
        # Delete marks
        Mark.objects.filter(student__in=students).delete()
        # Delete students
        students.delete()
        
        # cleanup user accounts
        for roll_no in roll_nos_to_check:
            remaining = Student.objects.filter(roll_no=roll_no).exists()
            if not remaining:
                CustomUser.objects.filter(username=roll_no).delete()
            else:
                user = CustomUser.objects.filter(username=roll_no).first()
                if user and (not user.student_profile or not Student.objects.filter(id=user.student_profile_id).exists()):
                     user.student_profile = Student.objects.filter(roll_no=roll_no).first()
                     user.save()
        
        count = len(student_ids)

    return Response({'message': f'Successfully deleted {count} student records'})


# ──────────────────────────────
# Marks — Teacher: GET & POST (bulk)
# ──────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def marks_list(request):
    """Get marks for a specific assessment configuration"""
    batch_id = request.query_params.get('batch')
    dept_id = request.query_params.get('department')
    year = request.query_params.get('year')
    sem = request.query_params.get('semester')
    assessment_type = request.query_params.get('assessment_type')

    if not all([batch_id, dept_id, year, sem, assessment_type]):
        return Response({'error': 'batch, department, year, semester, assessment_type are required'}, status=400)

    students = Student.objects.filter(
        batch_id=batch_id, department_id=dept_id, year=year
    ).order_by('roll_no')

    # Teacher should only see subjects assigned to them
    subjects = Subject.objects.filter(department_id=dept_id, semester=sem).order_by('code')
    if request.user.role == 'teacher':
        subjects = subjects.filter(teacher=request.user)

    marks_qs = Mark.objects.filter(
        student__in=students,
        subject__in=subjects,
        assessment_type=assessment_type
    )

    marks_dict = {}
    for m in marks_qs:
        marks_dict[(m.student_id, m.subject_id)] = m

    # Prefetch assigned_students for efficiency
    subjects = subjects.prefetch_related('assigned_students')
    subject_assignments = {subj.id: set(subj.assigned_students.values_list('id', flat=True)) for subj in subjects}

    result = []
    for st in students:
        row = {
            'student_id': st.id,
            'roll_no': st.roll_no,
            'name': st.name,
            'marks': {}
        }
        is_enrolled_in_any = False
        for subj in subjects:
            assignments = subject_assignments.get(subj.id, set())
            # If the subject has specific assignments and this student isn't one of them, mark as not enrolled
            if assignments and st.id not in assignments:
                row['marks'][subj.id] = {'value': None, 'is_absent': False, 'not_enrolled': True}
                continue

            is_enrolled_in_any = True
            m = marks_dict.get((st.id, subj.id))
            if m:
                row['marks'][subj.id] = {'value': 'AB' if m.is_absent else m.marks, 'is_absent': m.is_absent, 'not_enrolled': False}
            else:
                row['marks'][subj.id] = {'value': None, 'is_absent': False, 'not_enrolled': False}
                
        if is_enrolled_in_any:
            result.append(row)

    return Response({
        'students': result,
        'subjects': SubjectSerializer(subjects, many=True).data
    })


@api_view(['POST'])
@permission_classes([IsTeacher])
def marks_save(request):
    """Bulk save marks — teacher only, allowed ONLY for subjects assigned to them"""
    data = request.data  # list of {student_id, subject_id, assessment_type, marks, is_absent}
    if not isinstance(data, list):
        return Response({'error': 'Expected a list of mark entries'}, status=400)

    with transaction.atomic():
        for entry in data:
            student_id = entry.get('student_id')
            subject_id = entry.get('subject_id')
            assessment_type = entry.get('assessment_type')
            is_absent = entry.get('is_absent', False)
            marks_value = entry.get('marks', None)

            if not all([student_id, subject_id, assessment_type]):
                continue
                
            # Verify teacher is authorized to save this subject's marks
            try:
                subject = Subject.objects.get(id=subject_id)
                if subject.teacher != request.user and request.user.role != 'admin':
                    continue # unauthorized to edit this
            except Subject.DoesNotExist:
                continue

            Mark.objects.update_or_create(
                student_id=student_id,
                subject_id=subject_id,
                assessment_type=assessment_type,
                defaults={
                    'marks': None if is_absent else marks_value,
                    'is_absent': is_absent,
                    'entered_by': request.user,
                }
            )

    return Response({'status': 'saved'})


# ──────────────────────────────
# Analytics / Summary
# ──────────────────────────────
def _compute_summary(students_qs, subjects_qs, assessment_type):
    marks_qs = Mark.objects.filter(
        student__in=students_qs,
        subject__in=subjects_qs,
        assessment_type=assessment_type
    )
    marks_dict = {}
    for m in marks_qs:
        marks_dict[(m.student_id, m.subject_id)] = m

    # Prefetch assigned_students
    subjects_qs = subjects_qs.prefetch_related('assigned_students')
    subject_assignments = {subj.id: set(subj.assigned_students.values_list('id', flat=True)) for subj in subjects_qs}

    student_rows = []
    subject_stats = {
        s.id: {'attended': 0, 'pass': 0, 'fail': 0, 'r50_60': 0, 'r60_70': 0, 'r70_80': 0, 'r80_90': 0, 'r90_100': 0}
        for s in subjects_qs
    }

    for st in students_qs:
        pass_count = fail_count = absent_count = not_enrolled_count = 0
        marks_list_row = []
        is_enrolled_in_any = False
        for subj in subjects_qs:
            assignments = subject_assignments.get(subj.id, set())
            if assignments and st.id not in assignments:
                marks_list_row.append('N/E')
                not_enrolled_count += 1
                continue

            is_enrolled_in_any = True
            m = marks_dict.get((st.id, subj.id))
            if m is None or (not m.is_absent and m.marks is None):
                marks_list_row.append(None)
                # Not entered yet, skip stats
            elif m.is_absent:
                marks_list_row.append('AB')
                absent_count += 1
            else:
                marks_list_row.append(m.marks)
                subject_stats[subj.id]['attended'] += 1
                # pass threshold: 50% of max
                max_m = 30 if assessment_type.startswith('CT') else 100  # CT:30/pass15, CAT:100/pass50
                pct_mark = (m.marks / max_m) * 100

                if pct_mark >= 50:
                    pass_count += 1
                    subject_stats[subj.id]['pass'] += 1
                    if pct_mark < 60:
                        subject_stats[subj.id]['r50_60'] += 1
                    elif pct_mark < 70:
                        subject_stats[subj.id]['r60_70'] += 1
                    elif pct_mark < 80:
                        subject_stats[subj.id]['r70_80'] += 1
                    elif pct_mark < 90:
                        subject_stats[subj.id]['r80_90'] += 1
                    else:
                        subject_stats[subj.id]['r90_100'] += 1
                else:
                    fail_count += 1
                    subject_stats[subj.id]['fail'] += 1

        if is_enrolled_in_any:
            student_rows.append({
                'student_id': st.id,
                'roll_no': st.roll_no,
                'name': st.name,
                'marks': marks_list_row,
                'pass_count': pass_count,
                'fail_count': fail_count,
                'absent_count': absent_count,
                'not_enrolled_count': not_enrolled_count,
            })

    subject_summary = []
    for subj in subjects_qs:
        s = subject_stats[subj.id]
        att = s['attended']
        pct = (s['pass'] / att * 100) if att > 0 else 0
        subject_summary.append({
            'subject_id': subj.id,
            'code': subj.code,
            'name': subj.name,
            'staff_name': subj.staff_name,
            'attended': att,
            'pass': s['pass'],
            'fail': s['fail'],
            'pass_pct': round(pct, 1),
            'r50_60': s['r50_60'],
            'r60_70': s['r60_70'],
            'r70_80': s['r70_80'],
            'r80_90': s['r80_90'],
            'r90_100': s['r90_100'],
        })

    # Class summary
    total = len(student_rows)
    att_students = 0
    pass_students = 0
    fail_students = 0
    arrear_1 = 0
    arrear_2 = 0
    arrear_3plus = 0

    for r in student_rows:
        enrolled = len(list(subjects_qs)) - r['not_enrolled_count']
        if enrolled > 0 and r['absent_count'] < enrolled:
            att_students += 1
            total_arrears = r['fail_count'] + r['absent_count']
            
            if total_arrears == 0 and r['pass_count'] > 0:
                pass_students += 1
            elif total_arrears > 0:
                fail_students += 1
                if total_arrears == 1:
                    arrear_1 += 1
                elif total_arrears == 2:
                    arrear_2 += 1
                else:
                    arrear_3plus += 1

    class_pct = (pass_students / att_students * 100) if att_students > 0 else 0

    class_summary = {
        'total': total,
        'attended': att_students,
        'pass': pass_students,
        'fail': fail_students,
        'pass_pct': round(class_pct, 1),
        'arrear_1': arrear_1,
        'arrear_2': arrear_2,
        'arrear_3plus': arrear_3plus,
    }

    return student_rows, subject_summary, class_summary


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def marks_summary(request):
    batch_id = request.query_params.get('batch')
    dept_id = request.query_params.get('department')
    year = request.query_params.get('year')
    sem = request.query_params.get('semester')
    assessment_type = request.query_params.get('assessment_type')

    if not all([batch_id, dept_id, year, sem, assessment_type]):
        return Response({'error': 'All filters required'}, status=400)

    students_qs = Student.objects.filter(batch_id=batch_id, department_id=dept_id, year=year).order_by('roll_no')
    subjects_qs = Subject.objects.filter(department_id=dept_id, semester=sem).order_by('code')

    student_rows, subject_summary, class_summary = _compute_summary(students_qs, subjects_qs, assessment_type)

    return Response({
        'students': student_rows,
        'subject_summary': subject_summary,
        'class_summary': class_summary,
        'subjects': SubjectSerializer(subjects_qs, many=True).data,
    })


# ──────────────────────────────
# PDF Export
# ──────────────────────────────
@api_view(['GET'])
@permission_classes([IsTeacher])
def export_pdf(request):
    batch_id = request.query_params.get('batch')
    dept_id = request.query_params.get('department')
    year = request.query_params.get('year')
    sem = request.query_params.get('semester')
    assessment_type = request.query_params.get('assessment_type')

    if not all([batch_id, dept_id, year, sem, assessment_type]):
        return HttpResponse('Missing filters', status=400)

    try:
        batch = Batch.objects.get(id=batch_id)
        dept = Department.objects.get(id=dept_id)
    except (Batch.DoesNotExist, Department.DoesNotExist):
        return HttpResponse('Invalid batch or department', status=404)

    students_qs = Student.objects.filter(batch_id=batch_id, department_id=dept_id, year=year).order_by('roll_no')
    subjects_qs = Subject.objects.filter(department_id=dept_id, semester=sem).order_by('code')

    student_rows, subject_summary, class_summary = _compute_summary(students_qs, subjects_qs, assessment_type)

    context = {
        'department': dept.name,
        'batch': f"{batch.year_start}–{batch.year_end}",
        'year': year,
        'semester': sem,
        'assessment_type': assessment_type,
        'subjects': [{'code': s.code, 'name': s.name, 'staff_name': s.staff_name} for s in subjects_qs],
        'students': student_rows,
        'subject_summary': subject_summary,
        'class_summary': class_summary,
    }

    pdf_buffer = generate_marks_pdf(context)
    filename = f"assessment_{dept.code}_{year}_Sem{sem}_{assessment_type}.pdf"
    response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


# ──────────────────────────────
# Student — own marks only
# ──────────────────────────────
@api_view(['GET'])
@permission_classes([IsStudent])
def student_own_marks(request):
    """Get marks across all year profiles for the logged in student"""
    username = request.user.username
    profiles = Student.objects.filter(roll_no=username).order_by('-year')
    if not profiles.exists():
        return Response({'error': 'No student profile linked to this account'}, status=400)

    # Use the most recent profile for basic info
    latest_profile = profiles.first()
    
    assessment_type = request.query_params.get('assessment_type')
    # Query marks for ALL profiles associated with this roll number
    marks_qs = Mark.objects.filter(student__roll_no=username).select_related('subject', 'student')
    if assessment_type:
        marks_qs = marks_qs.filter(assessment_type=assessment_type)

    result = []
    # Map semester number to label
    SEM_MAP = {1: 'Sem 1', 2: 'Sem 2', 3: 'Sem 3', 4: 'Sem 4', 5: 'Sem 5', 6: 'Sem 6', 7: 'Sem 7', 8: 'Sem 8'}
    
    # Sort by year (descending), then semester (descending), then subject code
    for m in marks_qs.order_by('-student__year', '-subject__semester', 'subject__code'):
        max_m = 30 if m.assessment_type.startswith('CT') else 100
        pass_threshold = max_m * 0.5
        result.append({
            'subject_id': m.subject.id,
            'subject_code': m.subject.code,
            'subject_name': m.subject.name,
            'year': m.student.year,
            'semester': m.subject.semester,
            'semester_label': SEM_MAP.get(m.subject.semester, f'Sem {m.subject.semester}'),
            'assessment_type': m.assessment_type,
            'marks': 'AB' if m.is_absent else m.marks,
            'max_marks': max_m,
            'is_absent': m.is_absent,
            'status': 'AB' if m.is_absent else ('Pass' if (m.marks is not None and m.marks >= pass_threshold) else 'Fail'),
        })

    return Response({
        'student': StudentSerializer(latest_profile).data,
        'marks': result,
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    from .models import CustomUser
    count = CustomUser.objects.count()
    admins = CustomUser.objects.filter(role='admin').count()
    return Response({
        'status': 'ok',
        'total_users': count,
        'admin_users': admins,
    })
