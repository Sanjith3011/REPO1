from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from assessment.models import CustomUser, Department, Batch, Subject, Student, Mark


class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # ── Departments ──
        cse, _ = Department.objects.get_or_create(name='Computer Science and Engineering', code='CSE')
        ece, _ = Department.objects.get_or_create(name='Electronics and Communication Engineering', code='ECE')

        # ── Batches ──
        batch_cse, _ = Batch.objects.get_or_create(year_start=2024, year_end=2028, department=cse)
        batch_ece, _ = Batch.objects.get_or_create(year_start=2024, year_end=2028, department=ece)

        # ── Subjects — CSE ──
        cse_sem1_subjects = [
            ('CS1001', 'Engineering Mathematics I', 1),
            ('CS1002', 'Problem Solving and Python Programming', 1),
            ('CS1003', 'Engineering Physics', 1),
            ('CS1004', 'Engineering Chemistry', 1),
            ('CS1005', 'Communicative English', 1),
        ]
        cse_sem2_subjects = [
            ('CS2001', 'Engineering Mathematics II', 2),
            ('CS2002', 'Data Structures', 2),
            ('CS2003', 'Digital Principles', 2),
            ('CS2004', 'Object Oriented Programming', 2),
            ('CS2005', 'Environmental Science', 2),
        ]
        cse_sem3_subjects = [
            ('CS3001', 'Discrete Mathematics', 3),
            ('CS3002', 'Computer Organization', 3),
            ('CS3003', 'Database Management Systems', 3),
            ('CS3004', 'Operating Systems', 3),
            ('CS3005', 'Design and Analysis of Algorithms', 3),
        ]

        subj_map = {}
        for code, name, sem in cse_sem1_subjects + cse_sem2_subjects + cse_sem3_subjects:
            s, _ = Subject.objects.get_or_create(code=code, department=cse, semester=sem, defaults={'name': name})
            subj_map[code] = s

        # ── Students — CSE Batch 2024-2028, Year I ──
        students_data = [
            ('CS24001', 'Arjun Sharma'),
            ('CS24002', 'Priya Venkat'),
            ('CS24003', 'Rahul Krishnan'),
            ('CS24004', 'Deepika Rajan'),
            ('CS24005', 'Karthik Suresh'),
            ('CS24006', 'Sneha Lakshmi'),
            ('CS24007', 'Vijay Kumar'),
            ('CS24008', 'Anitha Selvam'),
            ('CS24009', 'Mohan Prakash'),
            ('CS24010', 'Kavitha Muthu'),
            ('CS24011', 'Balaji Rajendran'),
            ('CS24012', 'Pooja Nair'),
        ]

        students = []
        for roll_no, name in students_data:
            st, _ = Student.objects.get_or_create(
                roll_no=roll_no,
                defaults={'name': name, 'batch': batch_cse, 'department': cse, 'year': 'I'}
            )
            students.append(st)

        # ── Teacher account ──
        teacher, created = CustomUser.objects.get_or_create(
            username='teacher1',
            defaults={
                'password': make_password('pass123'),
                'first_name': 'Dr. Meena',
                'last_name': 'Subramaniam',
                'role': 'teacher',
                'department': cse,
                'is_staff': True,
            }
        )
        if created:
            self.stdout.write(f'  Created teacher: teacher1 / pass123')

        # ── Student accounts ──
        for i, st in enumerate(students[:3], 1):
            uname = f'student{i}'
            user, created = CustomUser.objects.get_or_create(
                username=uname,
                defaults={
                    'password': make_password('pass123'),
                    'first_name': st.name.split()[0],
                    'last_name': st.name.split()[-1],
                    'role': 'student',
                    'department': cse,
                    'student_profile': st,
                }
            )
            if created:
                self.stdout.write(f'  Created student: {uname} / pass123 → {st.roll_no}')

        # ── Sample marks for CT1 ──
        sem1_subjects = [subj_map[c] for c in ['CS1001', 'CS1002', 'CS1003', 'CS1004', 'CS1005']]
        sample_marks = [
            [12, 13, 10, 14, 11],
            [8,  9,  'AB', 12, 10],
            [15, 14, 13, 12, 11],
            [6,  7,  8,  9,  10],
            [11, 12, 13, 14, 15],
            [9,  'AB', 11, 12, 8],
            [14, 13, 12, 11, 10],
            [7,  8,  6,  9,  7],
            [13, 12, 14, 11, 12],
            [10, 11, 10, 13, 14],
            [5,  6,  'AB', 7,  8],
            [15, 14, 15, 13, 12],
        ]

        for st, marks_row in zip(students, sample_marks):
            for subj, val in zip(sem1_subjects, marks_row):
                is_absent = (val == 'AB')
                Mark.objects.get_or_create(
                    student=st,
                    subject=subj,
                    assessment_type='CT1',
                    defaults={
                        'marks': None if is_absent else float(val),
                        'is_absent': is_absent,
                        'entered_by': teacher,
                    }
                )

        self.stdout.write(self.style.SUCCESS('✅ Database seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('Login Credentials:')
        self.stdout.write('  Teacher  → username: teacher1  | password: pass123')
        self.stdout.write('  Student1 → username: student1  | password: pass123')
        self.stdout.write('  Student2 → username: student2  | password: pass123')
        self.stdout.write('  Student3 → username: student3  | password: pass123')
